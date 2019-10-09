import EntityBuilder from "../../../engine/ecs/EntityBuilder";
import { loadFoliageLayer } from "./Foliage2System";
import Mesh from "../../../graphics/ecs/mesh/Mesh";
import Transform from "../../../engine/ecs/components/Transform";
import { Foliage2, FoliageLayer } from "./Foliage2";
import { InstancedFoliage } from "../InstancedFoliage";
import { buildTreeOptimizationTask } from "../../../core/bvh2/BVHTasks";
import Task from "../../../core/process/task/Task";
import { BinaryBuffer } from "../../../core/binary/BinaryBuffer";
import TaskSignal from "../../../core/process/task/TaskSignal";
import { countTask, futureTask, promiseTask } from "../../../core/process/task/TaskUtils";
import Future from "../../../core/process/Future";
import { assert } from "../../../core/assert.js";

/**
 * Convert all existing instanced mesh components to individual Transform+Mesh pairs
 * @param {EntityComponentDataset} dataset
 * @param assetManager
 */
export function convertInstancedMeshComponents2Entities(dataset, assetManager) {
    assert.notEqual(dataset, undefined, 'dataset is undefined');
    assert.notEqual(assetManager, undefined, 'assetManager is undefined');

    const entitiesToStrip = [];

    /**
     *
     * @param {Foliage2} foliage2
     * @param entity
     */
    function visitFoliageEntities(foliage2, entity) {
        foliage2.layers.forEach(function (layer) {
            const modelURL = layer.modelURL.getValue();

            loadFoliageLayer(layer, assetManager)
                .then(function (instancedFoliage) {

                    const data = instancedFoliage.data;
                    const numInstances = data.length;

                    for (let i = 0; i < numInstances; i++) {
                        const transform = new Transform();

                        instancedFoliage.read(i, transform.position, transform.rotation, transform.scale);

                        const mesh = new Mesh();
                        mesh.url = modelURL;
                        //TODO Consider moving BVH info here also, to make this process faster

                        const entityBuilder = new EntityBuilder();

                        entityBuilder.add(transform).add(mesh).build(dataset);
                    }
                });
        });

        entitiesToStrip.push(entity);
    }

    dataset.traverseEntities([Foliage2], visitFoliageEntities);

    //remove converted foliage components
    entitiesToStrip.forEach(function (entity) {
        dataset.removeComponentFromEntity(entity, Foliage2);
    });
}

/**
 *
 * @param {EntityComponentDataset} dataset
 * @param {number} threshold minimum number of instances required before conversion happens
 * @returns {{main:Task, tasks:Task[]}}
 */
export function optimizeIndividualMeshesEntitiesToInstances(dataset, threshold = 30) {
    //get all entities that have a translation and mesh only
    const candidates = {};

    /**
     *
     * @param {Mesh} mesh
     * @param {Transform} transform
     * @param {int} entity
     */
    function visitMeshTransformEntity(mesh, transform, entity) {
        const modelURL = mesh.url;

        if (modelURL === undefined || modelURL === null || modelURL.trim().length === 0) {
            //not a valid URL
            return;
        }

        let list;
        if (!candidates.hasOwnProperty(modelURL)) {
            list = [];
            candidates[modelURL] = {
                mesh,
                list
            };
        } else {
            list = candidates[modelURL].list;
        }

        list.push({
            entity,
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale
        });
    }

    dataset.traverseEntitiesExact([Mesh, Transform], visitMeshTransformEntity);


    const tasks = [];


    const foliage2 = new Foliage2();

    const tBuild = new Task({
        name: "Build Meshes",
        cycleFunction: function () {
            const entityBuilder = new EntityBuilder();

            entityBuilder.add(foliage2);

            entityBuilder.build(dataset);

            return TaskSignal.EndSuccess;
        },
        computeProgress: function () {
            return 1;
        }
    });

    tasks.push(tBuild);

    let modelURL;


    function createLayerForInstances(group, modelURL) {
        const instances = group.list;
        const numInstances = instances.length;

        if (numInstances < threshold) {
            //too new instances to convert
            return;
        }

        //build up instanced mesh
        const instancedFoliage = new InstancedFoliage();

        const tLoadGeometry = promiseTask(new Promise(function (resolve, reject) {

            const mesh = group.mesh.mesh;
            const geometry = mesh.geometry;

            instancedFoliage.setInstance(geometry, mesh.material);

            resolve();
        }), 'Loading Instance Geometry');

        tasks.push(tLoadGeometry);


        const tPopulate = countTask(0, numInstances, function (i) {
            const instance = instances[i];

            //check for 0 scale
            if (instance.scale.isZero()) {
                //ignore an instance with 0 scale, it is not visible.
                return;
            }

            //check for duplicates before
            for (let j = i - 1; j >= 0; j--) {

                const instanceTemp = instances[j];

                if (instance.position.equals(instanceTemp.position) && instance.rotation.equals(instanceTemp.rotation) && instance.scale.equals(instanceTemp.scale)) {
                    //identical instance was found in the past, skip
                    return;
                }
            }

            instancedFoliage.add(instance.position, instance.rotation, instance.scale);
        });

        tPopulate.addDependency(tLoadGeometry);

        tPopulate.name = `Populate instanced of '${modelURL}'`;

        tasks.push(tPopulate);

        //
        const tOptimization = buildTreeOptimizationTask(instancedFoliage.bvh, instancedFoliage.data.length * 4);
        tOptimization.addDependency(tPopulate);

        tasks.push(tOptimization);

        let blob;
        const tSerialization = new Task({
            name: "Serialize data",
            cycleFunction: function () {
                const buffer = new BinaryBuffer();

                instancedFoliage.serialize(buffer);

                buffer.trim();

                blob = new Blob([new Uint8Array(buffer.data)]);


                return TaskSignal.EndSuccess;
            },
            computeProgress: function () {
                return 1;
            }
        });

        tSerialization.addDependency(tOptimization);

        tasks.push(tSerialization);

        const tConvertToURL = futureTask(new Future(function (resolve, reject) {
            const a = new FileReader();
            a.addEventListener('load', function (e) {

                const dataURL = e.target.result;

                //create foliage layer
                const layer = new FoliageLayer();

                layer.data = instancedFoliage;
                layer.modelURL.set(modelURL);
                layer.dataURL.set(dataURL);

                //TODO shadow settings are just assumptions
                layer.castShadow.set(true);
                layer.receiveShadow.set(true);

                foliage2.layers.add(layer);

                resolve();
            });

            a.addEventListener('error', function (e) {
                reject(e);
            });

            a.readAsDataURL(blob);
        }), 'Create dataURL');

        tConvertToURL.addDependency(tSerialization);
        tasks.push(tConvertToURL);

        //make layer building task a dependency to the main task
        tBuild.addDependency(tConvertToURL);

        //make a task to destroy original entities
        const tCleanup = countTask(0, numInstances, function (i) {
            const instance = instances[i];

            const entity = instance.entity;

            dataset.removeEntity(entity);
        });

        tCleanup.name = `Remove Original Instances of '${modelURL}'`;

        tCleanup.addDependency(tBuild);

        tasks.push(tCleanup);
    }

    for (modelURL in candidates) {

        if (!candidates.hasOwnProperty(modelURL)) {
            //by some black magic - the candidates don't have this modelURL. This is a sanity check
            continue;
        }

        const instances = candidates[modelURL];

        createLayerForInstances(instances, modelURL);

    }

    return {
        main: tBuild,
        tasks
    };
}