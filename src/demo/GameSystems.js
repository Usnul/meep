/**
 * Created by Alex on 01/07/2014.
 */

import { MeshSystem } from '../model/graphics/ecs/mesh/MeshSystem.js';
import AnimationControllerSystem from '../model/graphics/ecs/animation/AnimationControllerSystem.js';
import PositionSystem from '../model/engine/ecs/systems/TransformSystem.js';
import ScriptSystem from '../model/engine/ecs/systems/ScriptSystem.js';
import MotionSystem from '../model/engine/ecs/systems/MotionSystem.js';
import TagSystem from '../model/engine/ecs/systems/TagSystem.js';
import SteeringSystem from '../model/engine/ecs/systems/SteeringSystem.js';
import PathFollowingSystem from '../model/navigation/ecs/systems/PathFollowingSystem.js';
import PathSystem from '../model/navigation/ecs/systems/PathSystem.js';
import { CameraSystem } from '../model/graphics/ecs/camera/CameraSystem.js';
import { SoundEmitterSystem } from '../model/sound/ecs/SoundEmitterSystem.js';
import SoundListenerSystem from '../model/sound/ecs/SoundListenerSystem.js';
import SoundControllerSystem from '../model/sound/ecs/SoundControllerSystem.js';
import MortalitySystem from '../model/engine/ecs/systems/MortalitySystem.js';
import TimerSystem from '../model/engine/ecs/systems/TimerSystem.js';
import GUIElementSystem from '../model/engine/ecs/gui/GUIElementSystem.js';
import AnimationSystem from '../model/engine/ecs/systems/AnimationSystem.js';
import SynchronizePositionSystem from '../model/engine/ecs/systems/SynchronizePositionSystem.js';
import TerrainSystem from '../model/level/terrain/ecs/TerrainSystem.js';
import WaterSystem from '../model/graphics/ecs/water/WaterSystem.js';
import TrailSystem from '../model/graphics/ecs/trail/TrailSystem.js';
import Trail2DSystem from '../model/graphics/ecs/trail2d/Trail2DSystem.js';
import ClingToTerrainSystem from '../model/level/terrain/ecs/ClingToTerrainSystem.js';
import ViewportPositionSystem from '../model/engine/ecs/gui/ViewportPositionSystem.js';
import GridObstacleSystem from '../model/engine/grid/systems/GridObstacleSystem.js';
import GridPositionSystem from '../model/engine/grid/systems/GridPositionSystem.js';
import TopDownCameraControllerSystem from '../model/engine/input/ecs/systems/TopDownCameraControllerSystem.js';
import HighlightSystem from '../model/graphics/ecs/highlight/HighlightSystem.js';
import LightSystem from '../model/graphics/ecs/light/LightSystem.js';
import HeadsUpDisplaySystem from '../model/engine/ecs/gui/HeadsUpDisplaySystem.js';
import PropertySetSystem from '../model/engine/ecs/systems/PropertySetSystem.js';

import { Foliage2System } from "../model/level/foliage/ecs/Foliage2System.js";
import { ParticleEmitterSystem2 } from "../model/graphics/particles/ecs/ParticleEmitterSystem2.js";
import { FogOfWarSystem } from "../model/level/fow/FogOfWarSystem.js";
import { FogOfWarRevealerSystem } from "../model/level/fow/FogOfWarRevealerSystem.js";
import { BlackboardSystem } from "../model/engine/intelligence/blackboard/BlackboardSystem.js";
import { BehaviorSystem } from "../model/engine/intelligence/behavior/ecs/BehaviorSystem.js";
import { TopDownCameraLanderSystem } from "../model/engine/input/ecs/systems/TopDownCameraLanderSystem.js";
import { GridPosition2TransformSystem } from "../model/engine/grid/systems/GridPosition2TransformSystem.js";
import { SerializationMetadataSystem } from "../model/engine/ecs/systems/SerializationMetadataSystem.js";
import { InputSystem } from "../model/engine/input/ecs/systems/InputSystem.js";
import { AttachmentSocketsSystem } from "../model/engine/ecs/sockets/AttachmentSocketsSystem.js";
import { AttachmentSystem } from "../model/engine/ecs/attachment/AttachmentSystem.js";
import { TeamSystem } from "../extra/ecs/team/TeamSystem.js";
import InputControllerSystem from "../model/engine/input/ecs/systems/InputControllerSystem.js";

/**
 *
 * @param {Engine} engine
 * @param entityManager
 * @param graphics
 * @param sound
 * @param assetManager
 * @param grid
 * @param devices
 */
function initializeSystems(
    engine,
    entityManager,
    graphics,
    sound,
    assetManager,
    grid,
    devices
) {
    const guiSystem = new GUIElementSystem(engine.gui.view, engine);
    const headsUpDisplaySystem = new HeadsUpDisplaySystem(graphics);

    entityManager
        .addSystem(new ScriptSystem())
        .addSystem(new TeamSystem())
        .addSystem(new PathFollowingSystem())
        .addSystem(new PathSystem())
        .addSystem(new SteeringSystem())
        .addSystem(new MotionSystem())
        .addSystem(new TagSystem())
        .addSystem(new ParticleEmitterSystem2(assetManager, graphics))
        .addSystem(new SoundEmitterSystem(assetManager, sound.destination, sound.context))
        .addSystem(new SoundControllerSystem())
        .addSystem(new SoundListenerSystem(sound.context))
        .addSystem(new MortalitySystem())
        .addSystem(new TimerSystem())
        .addSystem(guiSystem)
        .addSystem(new PositionSystem())
        .addSystem(new AnimationSystem(graphics.viewport.size))
        .addSystem(new TopDownCameraControllerSystem(graphics))
        .addSystem(new TopDownCameraLanderSystem())
        .addSystem(new CameraSystem(graphics.scene, graphics))
        .addSystem(new MeshSystem(graphics, assetManager))
        .addSystem(new ClingToTerrainSystem())
        .addSystem(new TerrainSystem(graphics, grid, assetManager))
        .addSystem(new WaterSystem(graphics))
        .addSystem(new TrailSystem(graphics))
        .addSystem(new Trail2DSystem(graphics, assetManager))
        .addSystem(new Foliage2System(assetManager, graphics))
        .addSystem(new ViewportPositionSystem(graphics.viewport.size))
        .addSystem(new GridPosition2TransformSystem())
        .addSystem(new SynchronizePositionSystem())
        .addSystem(new GridObstacleSystem(grid))
        .addSystem(new GridPositionSystem())
        .addSystem(new InputSystem(devices))
        .addSystem(new InputControllerSystem(devices))
        .addSystem(new HighlightSystem(graphics))
        .addSystem(new LightSystem(graphics.scene, {
            shadowResolution: 1024
        }))
        .addSystem(new AnimationControllerSystem())
        .addSystem(new PropertySetSystem())
        .addSystem(headsUpDisplaySystem)
        .addSystem(new FogOfWarSystem(graphics))
        .addSystem(new FogOfWarRevealerSystem(0))
        .addSystem(new BlackboardSystem())
        .addSystem(new BehaviorSystem())
        .addSystem(new SerializationMetadataSystem())
        .addSystem(new AttachmentSocketsSystem())
        .addSystem(new AttachmentSystem())
    ;
}

export {
    initializeSystems
};
