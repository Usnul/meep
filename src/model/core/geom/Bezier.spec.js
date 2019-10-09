import { computeQuadraticBezier2D } from "./Bezier.js";
import Vector2 from "./Vector2.js";

test("computeQuadraticBezier2D hits knots",()=>{
    const v2 = new Vector2();

    computeQuadraticBezier2D(v2,1,3,5,7,11,13,0);

    expect(v2.x).toBeCloseTo(1);
    expect(v2.y).toBeCloseTo(3);

    computeQuadraticBezier2D(v2,1,3,5,7,11,13,1);

    expect(v2.x).toBeCloseTo(11);
    expect(v2.y).toBeCloseTo(13);
});