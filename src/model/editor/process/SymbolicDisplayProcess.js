import { Process } from "./Process.js";
import { EntityObserver } from "../../engine/ecs/EntityObserver.js";
import { ParticleEmitter } from "../../graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import Transform from "../../engine/ecs/components/Transform.js";
import EntityBuilder from "../../engine/ecs/EntityBuilder.js";
import Renderable from "../../engine/ecs/components/Renderable.js";
import {
    CameraHelper,
    DirectionalLightHelper,
    PointLightHelper,
    SpotLightHelper,
    Sprite,
    SpriteMaterial,
    Vector3 as ThreeVector3
} from "three";
import { SignalBinding } from "../../core/events/signal/SignalBinding.js";
import RenderSystem from "../../engine/ecs/systems/RenderSystem.js";
import EditorEntity from "../ecs/EditorEntity.js";
import { Camera } from "../../graphics/ecs/camera/Camera.js";
import { Light } from "../../graphics/ecs/light/Light.js";
import Script from "../../engine/ecs/components/Script.js";
import { max2, min2 } from "../../core/math/MathUtils.js";


class ComponentSymbolicDisplay extends Process {
    constructor(components, creator, destructor) {
        super();

        /**
         *
         * @type {EntityObserver}
         */
        this.observer = new EntityObserver(components, creator, destructor);
    }

    startup() {
        super.startup();

        /**
         *
         * @type {EntityComponentDataset}
         */
        const dataset = this.editor.engine.entityManager.dataset;

        dataset.addObserver(this.observer, true);
    }

    shutdown() {
        super.shutdown();

        const dataset = this.editor.engine.entityManager.dataset;

        dataset.removeObserver(this.observer, true);
    }
}

/**
 *
 * @param {!Transform} source
 * @param {!Transform} target
 * @param {SignalBinding[]} bindings
 * @param {boolean} [syncPosition=true]
 * @param {boolean} [syncRotation=true]
 * @param {boolean} [syncScale=true]
 */
function synchronizeTransform(source, target, bindings, syncPosition = true, syncRotation = true, syncScale = true) {
    function synchronizePosition(x, y, z) {
        target.position.set(x, y, z);
    }

    function synchronizeScale(x, y, z) {
        target.scale.set(x, y, z);
    }

    function synchronizeRotation(x, y, z, w) {
        target.rotation.set(x, y, z, w);
    }


    if (syncPosition) {
        const position = source.position;

        bindings.push(new SignalBinding(position.onChanged, synchronizePosition));

        synchronizePosition(position.x, position.y, position.z);
    }

    if (syncRotation) {
        const rotation = source.rotation;

        bindings.push(new SignalBinding(rotation.onChanged, synchronizeRotation));

        synchronizeRotation(rotation.x, rotation.y, rotation.z, rotation.w);
    }


    if (syncScale) {
        const scale = source.scale;
        bindings.push(new SignalBinding(scale.onChanged, synchronizeScale));

        synchronizePosition(scale.x, scale.y, scale.z);
    }

}

/**
 * @template C,T
 * @param {Editor} editor
 * @param {string} iconURL
 * @param {C} ComponentClass
 * @returns {ComponentSymbolicDisplay}
 */
function makePositionedIconDisplaySymbol(editor, iconURL, ComponentClass) {
    const entityManager = editor.engine.entityManager;


    const assetManager = editor.engine.assetManager;


    const spriteMaterial = new SpriteMaterial();
    spriteMaterial.depthTest = false;
    spriteMaterial.transparent = true;
    spriteMaterial.depthWrite = false;

    assetManager.promise(iconURL, 'texture').then(asset => {

        spriteMaterial.map = asset.create();
        spriteMaterial.needsUpdate = true;
    });


    /**
     *
     * @type {EntityBuilder[]}
     */
    const entities = [];

    /**
     *
     * @type {SignalBinding[][]}
     */
    const entityBindings = [];

    /**
     *
     * @param {T} component
     * @param {Transform} transform
     * @param {int} entity
     */
    function added(component, transform, entity) {
        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }

        const b = new EntityBuilder();

        const sprite = new Sprite(spriteMaterial);
        sprite.frustumCulled = false;
        sprite.matrixAutoUpdate = false;

        const cR = new Renderable(sprite);
        const cT = new Transform();


        //sprite size
        cT.scale.set(1, 1, 1);
        cR.boundingBox.setBounds(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5);

        const bindings = [];

        synchronizeTransform(transform, cT, bindings, true, false, false);

        bindings.forEach(b => b.link());

        b.add(cR);
        b.add(cT);
        b.add(new EditorEntity({ referenceEntity: entity }));

        b.build(entityDataset);

        entityBindings[entity] = bindings;

        entities[entity] = b;
    }

    /**
     *
     * @param {T} component
     * @param {Transform} transform
     * @param {int} entity
     */
    function removed(component, transform, entity) {
        const builder = entities[entity];

        if (builder === undefined) {
            return;
        }

        delete entities[entity];

        const bindings = entityBindings[entity];

        delete entityBindings[entity];

        bindings.forEach(b => b.unlink());


        builder.destroy();
    }

    return new ComponentSymbolicDisplay([ComponentClass, Transform], added, removed);
}


function buildThreeJSHelperEntity(helper) {
    helper.frustumCulled = false;

    const entityBuilder = new EntityBuilder();

    const renderable = new Renderable(helper);
    renderable.matrixAutoUpdate = false;

    entityBuilder.add(new Transform());
    entityBuilder.add(new EditorEntity());
    entityBuilder.add(renderable);
    entityBuilder.add(new Script(function () {
        let x0 = Infinity,
            y0 = Infinity,
            z0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity,
            z1 = -Infinity;

        if (typeof helper.update === "function") {
            helper.update();
        }

        helper.updateMatrixWorld(false, true);

        helper.traverse(function (object) {
            if (object.isLine || object.isMesh) {


                const geometry = object.geometry;

                geometry.computeBoundingBox();

                const boundingBox = geometry.boundingBox;

                object.updateMatrixWorld();

                const worldMatrix = object.matrixWorld;

                const bbMin = boundingBox.min;
                const bbMax = boundingBox.max;
                const corners = [
                    new ThreeVector3(bbMin.x, bbMin.y, bbMin.z),
                    new ThreeVector3(bbMin.x, bbMin.y, bbMax.z),
                    new ThreeVector3(bbMin.x, bbMax.y, bbMin.z),
                    new ThreeVector3(bbMin.x, bbMax.y, bbMax.z),
                    new ThreeVector3(bbMax.x, bbMin.y, bbMin.z),
                    new ThreeVector3(bbMax.x, bbMin.y, bbMax.z),
                    new ThreeVector3(bbMax.x, bbMax.y, bbMin.z),
                    new ThreeVector3(bbMax.x, bbMax.y, bbMax.z),
                ];


                corners.forEach((corner) => {
                    corner.applyMatrix4(worldMatrix);

                    x0 = min2(x0, corner.x);
                    y0 = min2(y0, corner.y);
                    z0 = min2(z0, corner.z);

                    x1 = max2(x1, corner.x);
                    y1 = max2(y1, corner.y);
                    z1 = max2(z1, corner.z);
                });
            }
        });


        renderable.boundingBox.setBounds(x0, y0, z0, x1, y1, z1);

        renderable.bvh.resize(x0, y0, z0, x1, y1, z1);
    }));


    return entityBuilder;
}

/**
 *
 * @param {Editor} editor
 * @returns {ComponentSymbolicDisplay}
 */
function makeLightSymbolicDisplay(editor) {

    const entityManager = editor.engine.entityManager;


    /**
     *
     * @type {EntityBuilder[]}
     */
    const entities = [];

    /**
     *
     * @type {SignalBinding[][]}
     */
    const entityBindings = [];


    /**
     *
     * @param {Light} light
     */
    function makeHelper(light) {
        const threeObject = light.__threeObject;

        if (threeObject === null) {
            console.warn('Light object is not initialized', light);
            return null;
        }
        if (threeObject === undefined) {
            console.error('Light object is undefined', light);
            return null;
        }

        switch (light.type.getValue()) {
            case Light.Type.SPOT:
                return new SpotLightHelper(threeObject);
            case  Light.Type.POINT:
                return new PointLightHelper(threeObject);
            case Light.Type.DIRECTION:
                return new DirectionalLightHelper(threeObject);

            default:
                return null;
        }
    }

    /**
     *
     * @param {Light} light
     * @param transform
     * @param entity
     */
    function added(light, transform, entity) {
        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }

        const helper = makeHelper(light);

        if (helper === null) {
            //no helper for this light type
            return;
        }

        const entityBuilder = buildThreeJSHelperEntity(helper);


        entityBuilder.build(entityDataset);

        const bindings = [
            new SignalBinding(light.type.onChanged, (t) => {
                //rebuild
                removed(light, transform, entity);
                added(light, transform, entity);
            })
        ];

        entityBindings[entity] = bindings;

        bindings.forEach(b => b.link());


        entities[entity] = entityBuilder;
    }

    function removed(light, transform, entity) {
        const builder = entities[entity];

        if (builder === undefined) {
            return;
        }

        const binding = entityBindings[entity];

        binding.forEach(b => b.unlink());

        delete entityBindings[entity];

        delete entities[entity];

        builder.destroy();
    }

    const display = new ComponentSymbolicDisplay([Light, Transform], added, removed);

    return display;
}

/**
 *
 * @param {Editor} editor
 * @returns {ComponentSymbolicDisplay}
 */
function makeCameraSymbolicDisplay(editor) {

    const entityManager = editor.engine.entityManager;


    /**
     *
     * @type {EntityBuilder[]}
     */
    const entities = [];


    function added(camera, transform, entity) {
        const entityDataset = entityManager.dataset;
        const editorEntity = entityDataset.getComponent(entity, EditorEntity);

        if (editorEntity !== undefined) {
            //skip editor's own entities
            return;
        }

        const helper = new CameraHelper(camera.object);

        const entityBuilder = buildThreeJSHelperEntity(helper);

        entityBuilder.build(entityDataset);

        entities[entity] = entityBuilder;
    }

    function removed(camera, transform, entity) {
        const builder = entities[entity];

        if (builder === undefined) {
            return;
        }

        delete entities[entity];

        builder.destroy();
    }

    const display = new ComponentSymbolicDisplay([Camera, Transform], added, removed);

    return display;
}

class SymbolicDisplayProcess extends Process {
    constructor() {
        super();

        this.name = SymbolicDisplayProcess.Id;

        const self = this;
        this.requiredSystems = [{
            klass: RenderSystem,
            factory: function () {
                return new RenderSystem(self.editor.engine.graphics);
            }
        }];


        this.spawnedSystems = [];
    }

    initialize(editor) {
        super.initialize(editor);

        /**
         *
         * @type {ComponentSymbolicDisplay[]}
         */
        this.displays = [
            makePositionedIconDisplaySymbol(editor, "data/textures/icons/editor/particles.png", ParticleEmitter),
            makePositionedIconDisplaySymbol(editor, "data/textures/icons/editor/camera.png", Camera),
            makePositionedIconDisplaySymbol(editor, "data/textures/icons/editor/light.png", Light),

            makeCameraSymbolicDisplay(editor),
            makeLightSymbolicDisplay(editor)
        ];

        this.displays.forEach(d => d.initialize(editor));
    }

    startup() {
        super.startup();


        const self = this;

        const entityManager = this.editor.engine.entityManager;

        this.requiredSystems.forEach(systemDescriptor => {

            const foundSystem = entityManager.systems.find(system => system instanceof systemDescriptor.klass);

            if (foundSystem === undefined) {
                const system = systemDescriptor.factory();

                self.spawnedSystems.push(system);

                entityManager.addSystem(system);

                entityManager.startSystem(system, console.log, console.error);
            }
        });

        this.displays.forEach(d => d.startup());
    }

    shutdown() {
        super.shutdown();

        const entityManager = this.editor.engine.entityManager;


        this.displays.forEach(d => d.shutdown());


        this.spawnedSystems.forEach(s => {
            entityManager.removeSystem(s);
        });

        this.spawnedSystems = [];
    }
}

SymbolicDisplayProcess.Id = 'symbolic-display-process';

export { SymbolicDisplayProcess };
