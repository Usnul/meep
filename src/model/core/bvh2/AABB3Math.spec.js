import { seededRandom } from "../math/MathUtils.js";
import { intersectRay } from "./AABB3Math.js";

test.skip("performance raycast", () => {
    const rng = seededRandom(42);

    let p = 0;

    const iterations = 1000000;

    let i;

    //warm up
    for (i = 0; i < 10000; i++) {
        rng();
        intersectRay(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0);
    }

    //isolate timing of random function
    const rngStartTime = Date.now();
    for (i = 0; i < iterations; i++) {
        rng();
        rng();
        rng();

        rng();
        rng();
        rng();

        rng();
        rng();
        rng();

        rng();
        rng();
        rng();
    }

    const rngTime = Date.now() - rngStartTime;

    const benchStartTime = Date.now();
    for (i = 0; i < iterations; i++) {

        const x0 = rng();
        const y0 = rng();
        const z0 = rng();

        const x1 = x0 + rng();
        const y1 = y0 + rng();
        const z1 = z0 + rng();

        const oX = rng();
        const oY = rng();
        const oZ = rng();

        const dirX = rng();
        const dirY = rng();
        const dirZ = rng();

        if (intersectRay(x0, y0, z0, x1, y1, z1, oX, oY, oZ, dirX, dirY, dirZ)) {
            p++;
        }
    }

    const benchTime = Date.now() - benchStartTime;

    const trueBenchTime = benchTime - rngTime;

    console.log(`OPS: ${(iterations * 1000 / trueBenchTime)}, HITS:${p} `);

});