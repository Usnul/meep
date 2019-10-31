import { BinarySerializationRegistry } from "../model/engine/ecs/storage/binary/BinarySerializationRegistry.js";
import { TransformSerializationAdapter } from "../model/engine/ecs/components/Transform.js";
import { PathFollowerSerializationAdapter } from "../model/navigation/ecs/components/PathFollower.js";
import { PathSerializationAdapter } from "../model/navigation/ecs/components/Path.js";
import { TagSerializationAdapter } from "../model/engine/ecs/components/Tag.js";
import { ParticleEmitterSerializationAdapter } from "../model/graphics/particles/particular/engine/emitter/serde/ParticleEmitterSerializationAdapter.js";
import { SoundEmitterSerializationAdapter } from "../model/sound/ecs/SoundEmitter.js";
import { SoundControllerSerializationAdapter } from "../model/sound/ecs/SoundController.js";
import { SoundListenerSerializationAdapter } from "../model/sound/ecs/SoundListener.js";
import { AnimationSerializationAdapter } from "../model/engine/ecs/components/Animation.js";
import { MeshSerializationAdapter } from "../model/graphics/ecs/mesh/Mesh.js";
import { TopDownCameraControllerSerializationAdapter } from "../model/engine/input/ecs/components/TopDownCameraController.js";
import { TopDownCameraLanderSerializationAdapter } from "../model/engine/input/ecs/components/TopDownCameraLander.js";
import { CameraSerializationAdapter } from "../model/graphics/ecs/camera/Camera.js";
import { ClingToTerrainSerializationAdapter } from "../model/level/terrain/ecs/ClingToTerrain.js";
import { TerrainSerializationAdapter } from "../model/level/terrain/ecs/Terrain.js";
import { WaterSerializationAdapter } from "../model/graphics/ecs/water/Water.js";
import { InstancedMeshSerializationAdapter } from "../model/level/foliage/ecs/Foliage2.js";
import { GridPosition2TransformSerializationAdapter } from "../model/engine/grid/components/GridPosition2Transform.js";
import { GridObstacleSerializationAdapter } from "../model/engine/grid/components/GridObstacle.js";
import { GridPositionSerializationAdapter } from "../model/engine/grid/components/GridPosition.js";
import { HighlightSerializationAdapter } from "../model/graphics/ecs/highlight/Highlight.js";
import { LightSerializationAdapter } from "../model/graphics/ecs/light/Light.js";
import { AnimationControllerSerializationAdapter } from "../model/graphics/ecs/animation/AnimationController.js";
import { PropertySetSerializationAdapter } from "../model/engine/ecs/components/PropertySet.js";
import { FogOfWarSerializationAdapter } from "../model/level/fow/FogOfWar.js";
import { FogOfWarRevealerSerializationAdapter } from "../model/level/fow/FogOfWarRevealer.js";
import { BlackboardSerializationAdapter } from "../model/engine/intelligence/blackboard/Blackboard.js";
import { SerializationMetadataSerializationAdapter } from "../model/engine/ecs/components/SerializationMetadata.js";
import { SteeringSerializationAdapter } from "../model/engine/ecs/components/Steering.js";
import { MotionSerializationAdapter } from "../model/engine/ecs/components/Motion.js";
import { TeamSerializationAdapter } from "../extra/ecs/team/Team.js";

export const gameBinarySerializationRegistry = new BinarySerializationRegistry();


gameBinarySerializationRegistry.registerAdapters([
    new TransformSerializationAdapter(),
    new MinimapMarkerSerializationAdapter(),
    new GeneratedArmySerializationAdapter(),
    new ArmySerializationAdapter(),
    new HeroSerializationAdapter(),
    new NameSerializationAdapter(),
    new CommanderSerializationAdapter(),
    new TeamSerializationAdapter(),
    new ItemContainerSerializationAdapter(),
    new PathFollowerSerializationAdapter(),
    new PathSerializationAdapter(),
    new TagSerializationAdapter(),
    new ParticleEmitterSerializationAdapter(),
    new SoundEmitterSerializationAdapter(),
    new SoundControllerSerializationAdapter(),
    new SoundListenerSerializationAdapter(),
    new AnimationSerializationAdapter(),
    new MeshSerializationAdapter(),
    new TopDownCameraControllerSerializationAdapter(),
    new TopDownCameraLanderSerializationAdapter(),
    new CameraSerializationAdapter(),
    new ClingToTerrainSerializationAdapter(),
    new TerrainSerializationAdapter(),
    new WaterSerializationAdapter(),
    new InstancedMeshSerializationAdapter(),
    new GridPosition2TransformSerializationAdapter(),
    new GridObstacleSerializationAdapter(),
    new GridPositionSerializationAdapter(),
    new HighlightSerializationAdapter(),
    new LightSerializationAdapter(),
    new AnimationControllerSerializationAdapter(),
    new PropertySetSerializationAdapter(),
    new FogOfWarSerializationAdapter(),
    new FogOfWarRevealerSerializationAdapter(),
    new BlackboardSerializationAdapter(),
    new SerializationMetadataSerializationAdapter(),
    new QuesterSerializationAdapter(),
    new FacingDirectionSerializationAdapter(),
    new SteeringSerializationAdapter(),
    new MotionSerializationAdapter(),
    new CombatUnitSerializationAdapter(),
]);
