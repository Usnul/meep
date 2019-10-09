import { EngineHarness } from "./demo/EngineHarness.js";
import Vector3 from "./model/core/geom/Vector3.js";
import Vector2 from "./model/core/geom/Vector2.js";

const harness = new EngineHarness();
harness.initialize().then(engine => {

    // setup basic lights
    EngineHarness.buildLights(engine);

    // setup a camera
    const camera = EngineHarness.buildCamera({ engine, target: new Vector3(10, 0, 10), pitch: -0.7 });

    EngineHarness.buildOrbitalCameraController({ cameraEntity: camera.entity, engine });

    //create a sample terrain
    EngineHarness.buildTerrain({
        engine,
        size: new Vector2(10, 10),
        heightRange: 4,
        resolution: 50,
        waterLevel: 0
    });
});
