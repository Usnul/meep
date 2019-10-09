import { OptionGroup } from "./OptionGroup.js";
import Item from "../../../../model/game/ecs/component/Item.js";
import EntityBuilder from "../../../../model/engine/ecs/EntityBuilder.js";
import InputController from "../../../../model/engine/input/ecs/components/InputController.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import { pick } from "../../../../model/game/util/ScreenGridPicker.js";
import { downloadAsFile, downloadUrlAsFile } from "../../../../model/core/binary/ByteArrayTools.js";
import { ParticleEmitter } from "../../../../model/graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import Mesh from "../../../../model/graphics/ecs/mesh/Mesh.js";
import { FogOfWar } from "../../../../model/level/fow/FogOfWar.js";
import { Camera, ProjectionType } from "../../../../model/graphics/ecs/camera/Camera.js";
import { OrthographicCamera } from "three";
import Transform from "../../../../model/engine/ecs/components/Transform.js";
import Vector3 from "../../../../model/core/geom/Vector3.js";
import {
    findCommanderOfEntity,
    findPlayerCharacter,
    findSceneProperties
} from "../../../../model/game/scenes/strategy/StrategyScene.js";
import { Blackboard } from "../../../../model/engine/intelligence/blackboard/Blackboard.js";
import { PROPERTY_TUTORIAL_ENABLED } from "../../../../model/game/tutorial/TutorialManager.js";
import {
    convertInstancedMeshComponents2Entities,
    optimizeIndividualMeshesEntitiesToInstances
} from "../../../../model/level/foliage/ecs/InstancedMeshUtils.js";
import TaskGroup from "../../../../model/core/process/task/TaskGroup.js";
import { resetMusicTracks } from "./OptionsView.js";
import Tag from "../../../../model/engine/ecs/components/Tag.js";
import Army from "../../../../model/game/ecs/component/Army.js";
import Hero from "../../../../model/game/ecs/component/Hero.js";
import Commander from "../../../../model/game/ecs/component/Commander.js";
import Team from "../../../../model/game/ecs/component/Team.js";
import ItemContainer from "../../../../model/game/ecs/component/ItemContainer.js";
import GeneratedArmy from "../../../../model/game/ecs/component/GeneratedArmy.js";
import TopDownCameraController from "../../../../model/engine/input/ecs/components/TopDownCameraController.js";
import GridPosition from "../../../../model/engine/grid/components/GridPosition.js";
import HeadsUpDisplay from "../../../../model/engine/ecs/components/HeadsUpDisplay.js";
import PathFollower from "../../../../model/navigation/ecs/components/PathFollower.js";
import { assert } from "../../../../model/core/assert.js";
import { EntityTags } from "../../../../model/game/logic/strategy/EntityTags.js";
import ObservedBoolean from "../../../../model/core/model/ObservedBoolean.js";
import DataType from "../../../../model/core/parser/simple/DataType.js";
import Vector1 from "../../../../model/core/geom/Vector1.js";
import { noop } from "../../../../model/core/function/Functions.js";


/**
 *
 * @param {View} view
 * @param {OptionGroup} options
 * @param {string[]} path
 */
export function gateViewByOptionFlag(view, options, path) {

    const option = options.resolve(path);


    view.bindSignal(option.on.written, () => view.visible = option.read());
    view.on.linked.add(() => view.visible = option.read());
}

/**
 * @param {Engine} engine
 * @returns {OptionGroup}
 */
export function createDevelopmentOptionsGroup(engine) {
    assert.notEqual(engine, undefined, 'engine is undefined');

    const group = new OptionGroup('DEVELOPMENT');

    const gUI = group
        .addGroup('ui');

    /**
     *
     * @param {OptionGroup} folder
     * @param {string} id
     * @param {DataType} type
     */
    function addValueOption(folder, id, type) {
        let value;

        if (type === DataType.Boolean) {
            value = new ObservedBoolean(true);
        } else if (type === DataType.Number) {
            value = new Vector1(0);
        } else {
            throw new Error(`Unsupported datatype '${type}'`);
        }

        folder.add(id, () => value.getValue(), v => value.set(v));
    }

    gUI.add('push_terrain_overlay', () => function () {
        const terrain = obtainTerrain(engine.entityManager.dataset);

        if (terrain !== null) {
            terrain.overlay.push();
        }
    }, noop);
    gUI.add('pop_terrain_overlay', () => function () {
        const terrain = obtainTerrain(engine.entityManager.dataset);

        if (terrain !== null) {
            terrain.overlay.pop();
        }
    }, noop);

    addValueOption(gUI, 'strategy_minimap', DataType.Boolean);
    addValueOption(gUI, 'strategy_score', DataType.Boolean);
    addValueOption(gUI, 'strategy_command_help', DataType.Boolean);
    addValueOption(gUI, 'strategy_command_options', DataType.Boolean);
    addValueOption(gUI, 'strategy_command_squad', DataType.Boolean);
    addValueOption(gUI, 'strategy_command_inventory', DataType.Boolean);
    addValueOption(gUI, 'strategy_command_end-turn', DataType.Boolean);
    addValueOption(gUI, 'strategy_hud_hero', DataType.Boolean);
    addValueOption(gUI, 'strategy_hud_enemy', DataType.Boolean);
    addValueOption(gUI, 'strategy_hud_town', DataType.Boolean);

    addValueOption(gUI, 'combat_hud_unit', DataType.Boolean);
    addValueOption(gUI, 'combat_turn_order', DataType.Boolean);
    addValueOption(gUI, 'combat_command_wait', DataType.Boolean);
    addValueOption(gUI, 'combat_command_flee', DataType.Boolean);
    addValueOption(gUI, 'combat_command_defend', DataType.Boolean);
    addValueOption(gUI, 'combat_command_instant', DataType.Boolean);
    addValueOption(gUI, 'combat_command_options', DataType.Boolean);

    group
        .add('Kill All', () => function () {
            const dataset = engine.entityManager.dataset;

            dataset.traverseEntities([Tag], function (tag, entity) {
                if (tag.name === EntityTags.EnemyGroup) {
                    dataset.removeEntity(entity)
                }
            });
        })
        .add('+1 Level', () => function () {
            engine.entityManager.traverseEntities([Hero, Army], function (hero, army, entity) {
                army.units.forEach(function (u) {
                    u.level._add(1)
                })
            });
        })
        .add('+50 Levels', () => function () {
            engine.entityManager.traverseEntities([Hero, Army], function (hero, army, entity) {
                army.units.forEach(function (u) {
                    u.level._add(50)
                })
            });
        })
        .add('Give 1000 Gold', () => function () {
            engine.entityManager.traverseEntities([Commander, Team], function (commander, team, entity) {
                if (team.getValue() === 0) {
                    commander.money._add(1000);
                }
            });
        })
        .add('Give 1 Of Each Item', () => function () {
            /**
             *
             * @type {ItemDescriptionDatabase}
             */
            const items = engine.staticKnowledge.items;

            engine.entityManager.dataset.traverseEntities([ItemContainer, Team], function (ic, team, entity) {
                if (team.getValue() === 0) {
                    items.traverse(function (itemDescriptor) {
                        const item = new Item();
                        item.description = itemDescriptor;

                        ic.addItem(item);
                    });
                }
            });
        })
        .add('Regenerate Enemy Armies', () => function () {
            const em = engine.entityManager;

            const ecd = em.dataset;

            // Regenerate units
            ecd.traverseEntities([Army, GeneratedArmy], function (army, generator, entity) {
                army.units.reset();
                generator.modelURL = null;
                generator.completed = false;
                ecd.removeComponentFromEntity(entity, Army);
                ecd.addComponentToEntity(entity, army);
            });

            // Rebuild visual appearance
            ecd.traverseEntities([Mesh, Tag], function (mesh, tag, entity) {
                if (tag.name === EntityTags.EnemyGroup) {
                    mesh.url = null;
                    mesh.mesh = null;
                    ecd.removeComponentFromEntity(entity, Mesh);
                    ecd.addComponentToEntity(entity, mesh);
                }
            });
        })
        .add('Enable Teleporter', () => function () {
            const entityManager = engine.entityManager;

            const dataset = entityManager.dataset;

            const builder = new EntityBuilder();

            let lastTapTime = 0;

            builder.add(new InputController([{
                path: "pointer/on/tap",
                listener: function (position, event) {
                    const tapTime = performance.now();
                    if (tapTime - lastTapTime < 1000) {

                        event.preventDefault();
                        event.stopPropagation();


                        /**
                         *
                         * @type {Terrain}
                         */
                        const terrain = obtainTerrain(dataset);

                        dataset.traverseEntities([Hero, GridPosition, Team], function (hero, gridPosition, team, entity) {
                            if (team.getValue() === 0) {
                                pick(position.x, position.y, engine.graphics, terrain, function (p) {
                                    gridPosition.copy(p.clone().floor());
                                });
                            }
                        });
                    }

                    lastTapTime = tapTime;
                }
            }]));

            builder.build(dataset);

            alert("Use double click to teleport your hero!");
        })
        .add('Download state', () => function () {
            //download
            const state = engine.gameStateLoader.extractState();


            downloadAsFile(state.data, "level.bin");
        })
        .add('Build Preview', () => function () {
            const em = engine.entityManager;

            const cleanupFunctions = [];

            const dataset = em.dataset;

            function clearObjects() {

                dataset.traverseComponents(HeadsUpDisplay, function (hud, entity) {
                    dataset.removeComponentFromEntity(entity, HeadsUpDisplay);

                    cleanupFunctions.push(function () {
                        dataset.addComponentToEntity(entity, hud);
                    });

                });

                dataset.traverseComponents(ParticleEmitter, function (emitter, entity) {
                    dataset.removeComponentFromEntity(entity, ParticleEmitter);
                    cleanupFunctions.push(function () {
                        dataset.addComponentToEntity(entity, emitter);
                    });
                });

                dataset.traverseComponents(Tag, function (tag, entity) {
                    if ([
                        EntityTags.Character,
                        EntityTags.Town,
                        EntityTags.EnemyGroup,
                        EntityTags.Chest
                    ].indexOf(tag.name) !== -1) {

                        const mesh = dataset.getComponent(entity, Mesh);
                        dataset.removeComponentFromEntity(entity, Mesh);

                        if (mesh !== undefined) {
                            cleanupFunctions.push(function () {
                                dataset.addComponentToEntity(entity, mesh);
                            });
                        }

                    }
                });
            }

            const terrain = obtainTerrain(dataset);

            // Disable clouds so they don't render over the preview
            const oldTerrainState = {
                cloudsEnabled: terrain.clouds.enabled
            };

            terrain.clouds.enabled = false;

            cleanupFunctions.push(function () {
                // Restore clouds
                terrain.clouds.enabled = oldTerrainState.cloudsEnabled;
            });

            function clearTerrainOverlay() {
                terrain.overlay.push();

                cleanupFunctions.push(function () {
                    terrain.overlay.pop();
                });
            }


            function removeFogOfWar() {
                dataset.traverseComponents(FogOfWar, function (fow, entity) {
                    dataset.removeComponentFromEntity(entity, FogOfWar);

                    cleanupFunctions.push(function () {
                        dataset.addComponentToEntity(entity, fow);
                    });
                });
            }


            let cameraObject;
            let cameraEntity;

            function buildCamera() {
                //find existing active camera
                dataset.traverseComponents(Camera, function (c) {
                    if (c.active) {
                        c.active.set(false);

                        cleanupFunctions.push(function () {
                            c.active.set(true);
                        });
                    }
                });

                dataset.traverseComponents(FogOfWar, function (fow, entity) {
                    dataset.removeComponentFromEntity(entity, FogOfWar);

                    cleanupFunctions.push(function () {
                        dataset.addComponentToEntity(entity, fow);
                    });
                });

                const camera = new Camera();

                camera.projectionType.set(ProjectionType.Orthographic);
                camera.active.set(true);
                camera.autoClip = false;

                cameraObject = new OrthographicCamera();

                const c = camera.object = new OrthographicCamera();
                c.near = 0.1;
                c.far = terrain.heightRange + 2;


                const cameraTransform = new Transform();

                const v3TerrainMiddle = new Vector3();
                terrain.mapPointGrid2World(terrain.size.x / 2, terrain.size.y / 2, v3TerrainMiddle);

                cameraTransform.position.set(v3TerrainMiddle.x, terrain.heightRange / 2 + 1, v3TerrainMiddle.z);
                cameraTransform.rotation.set(-0.7071067811865475, 0, 0, 0.7071067811865476);

                cameraEntity = new EntityBuilder();
                cameraEntity.add(camera).add(cameraTransform).build(dataset);

                cleanupFunctions.unshift(function () {
                    cameraEntity.destroy();
                });
            }


            //tick entity manager to force update
            em.simulate(0.0001);


            //promise all terrain tiles
            terrain.pTiles
                .then(function (tiles) {
                    const promisedTiles = [];
                    tiles.traverse(function (tile) {
                        const x = tile.gridPosition.x;
                        const y = tile.gridPosition.y;

                        const tilePromise = new Promise(function (resolve, reject) {
                            tiles.obtain(x, y, resolve);
                        });
                        promisedTiles.push(tilePromise);
                    });

                    //promise all tiles
                    return Promise.all(promisedTiles);
                })
                .then(function () {
                    //delay
                    return new Promise(function (resolve, reject) {
                        setTimeout(resolve, 100);
                    });
                })
                .then(function () {
                    clearObjects();
                    clearTerrainOverlay();
                    removeFogOfWar();
                    buildCamera();

                    const viewport = engine.graphics.viewport;

                    const oldViewportSize = viewport.size.clone();
                    cleanupFunctions.push(function () {
                        viewport.size.copy(oldViewportSize);
                    });

                    const width = 2048;
                    const height = 2048;
                    viewport.size.set(width, height);

                    const boxSizeScale = 1.15;

                    const w = terrain.size.x * terrain.worldGridScale.x * boxSizeScale;
                    const h = terrain.size.y * terrain.worldGridScale.y * boxSizeScale;

                    cameraObject = cameraEntity.getComponent(Camera).object;

                    cameraObject.left = -w / 2;
                    cameraObject.right = w / 2;
                    cameraObject.top = h / 2;
                    cameraObject.bottom = -h / 2;

                    cameraObject.updateProjectionMatrix();

                    engine.graphics.render();

                    const gl = engine.graphics.graphics.context;


                    var ctx = document.createElement('canvas').getContext("2d");

                    ctx.canvas.width = width;
                    ctx.canvas.height = height;

                    // ctx.putImageData(imageData, 0, 0);
                    ctx.drawImage(gl.canvas, 0, 0, width, height, 0, 0, width, height);


                    const dataURL = ctx.canvas.toDataURL('image/png');
                    downloadUrlAsFile(dataURL, 'preview.png');

                    cleanupFunctions.forEach(c => c());
                });
        })
        .add('Download as level (strategy)', () => function () {
            const em = engine.entityManager;
            const ecd = em.dataset;

            /**
             *
             * @param {GeneratedArmy} gen
             * @param {Army} army
             * @param {Mesh} mesh
             * @param {Tag} tag
             * @param {int} e
             */
            function visitGeneratedEntity(gen, army, mesh, tag, e) {
                gen.completed = false;
                army.units.reset();
                if (tag.name === EntityTags.EnemyGroup) {
                    gen.modelURL = null;
                    mesh.url = null;
                }
            }

            ecd.traverseEntities([GeneratedArmy, Army, Mesh, Tag], visitGeneratedEntity);

            //get player character
            const playerCharacterEntity = findPlayerCharacter(ecd);

            //center camera on player
            const transform = ecd.getComponent(playerCharacterEntity, Transform);

            /**
             *
             * @param {TopDownCameraController} cameraController
             */
            function visitCameraController(cameraController) {
                const target = cameraController.target;
                cameraController.distance = 11;
                cameraController.yaw = 0;
                cameraController.roll = 0;
                cameraController.pitch = -1.08210413624;
                target.set(transform.position.x, -9, transform.position.z);
            }

            if (transform !== null) {
                const topDownCameraControllerSystem = em.getSystemByComponentClass(TopDownCameraController);

                ecd.traverseComponents(TopDownCameraController, visitCameraController);

                let originalValue = topDownCameraControllerSystem.enabled.get();

                if (!originalValue) {
                    topDownCameraControllerSystem.enabled.set(true);
                }

                topDownCameraControllerSystem.update(0);
                topDownCameraControllerSystem.enabled.set(originalValue);
            }

            //set default walking speed

            /**
             *
             * @type {PathFollower}
             */
            const playerPathFollowerC = ecd.getComponent(playerCharacterEntity, PathFollower);
            playerPathFollowerC.speed.set(5);

            //reset SceneProperties
            const sceneProperties = findSceneProperties(em);
            sceneProperties.set('randomFinds/seed', 42);

            const { commander, entity: commanderEntity } = findCommanderOfEntity(playerCharacterEntity, ecd);
            commander.money.set(400);
            commander.turnsTaken.set(0);

            //set enemy commanders into "takenTurn" state
            ecd.traverseComponents(Commander, c => {
                if (c !== commander) {
                    c.turnFinished.set(true);
                    c.turnsTaken.set(0);
                }
            });

            //reset music
            resetMusicTracks(ecd);

            /**
             *
             * @type {Blackboard}
             */
            const blackboard = ecd.getComponent(commanderEntity, Blackboard);

            //drop blackboard data
            ecd.traverseComponents(Blackboard, (b) => b.reset());

            //enable tutorial
            blackboard.acquireBoolean(PROPERTY_TUTORIAL_ENABLED).set(true);
            //reset hero pick
            blackboard.acquireBoolean('initial.heroPicked').set(false);

            //download
            const state = engine.gameStateLoader.extractState();
            downloadAsFile(state.data, "level.bin");
        })
        .add("Convert Foliage to Meshes", () => function () {
            const em = engine.entityManager;
            convertInstancedMeshComponents2Entities(em.dataset, engine.assetManager);

        })
        .add("Optimize Meshes", () => function () {
            const dataset = engine.entityManager.dataset;

            const optimization = optimizeIndividualMeshesEntitiesToInstances(dataset);
            const t = new TaskGroup(optimization.tasks);
            engine.loadSlowTask(t);
            engine.executor.runGroup(t);
        });

    return group;
}
