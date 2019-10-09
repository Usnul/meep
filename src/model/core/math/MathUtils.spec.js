import {clamp, computeWholeDivisorLow, copysign, inverseLerp, lerp, max2, max3, min2, min3, sign} from "./MathUtils.js";
import {
    computeHashArray,
    computeHashFloat,
    computeHashFloatArray,
    cubicCurve,
    isValueBetween,
    isValueBetweenInclusive,
    makeCubicCurve,
    quadraticCurve,
    solveQuadratic
} from "./MathUtils";

test('min2', () => {
    expect(min2(0, 0)).toBe(0);

    expect(min2(2, 1)).toBe(1);

    expect(min2(1, 2)).toBe(1);

    expect(min2(-1, 1)).toBe(-1);

    expect(min2(1, -1)).toBe(-1);
});

test('max2', () => {
    expect(max2(0, 0)).toBe(0);

    expect(max2(2, 1)).toBe(2);

    expect(max2(1, 2)).toBe(2);

    expect(max2(-1, 1)).toBe(1);

    expect(max2(1, -1)).toBe(1);
});

test("max3", ()=>{
    expect(max3(-1, -3, 1)).toBe(1);

    expect(max3(-3, -1, 1)).toBe(1);

    expect(max3(-3, 1, -1)).toBe(1);

    expect(max3(-1, 1, -3)).toBe(1);

    expect(max3(1, -1, -3)).toBe(1);

    expect(max3(1, -3, -1)).toBe(1);

    expect(max3(-3, 1, 1)).toBe(1);

    expect(max3(3, 1, 1)).toBe(3);

    expect(max3(3, 3, -1)).toBe(3);

    expect(max3(3, 3, 4)).toBe(4);

    expect(max3(3, 0, 3)).toBe(3);

    expect(max3(3, 4, 3)).toBe(4);
});

test("min3", ()=>{
    expect(min3(-1, -3, 1)).toBe(-3);

    expect(min3(-3, -1, 1)).toBe(-3);

    expect(min3(-1, 1, -3)).toBe(-3);

    expect(min3(1, -3, -1)).toBe(-3);

    expect(min3(-3, 1, -1)).toBe(-3);

    expect(min3(1, -1, -3)).toBe(-3);

    expect(min3(-3, 1, 1)).toBe(-3);

    expect(min3(2, 1, 1)).toBe(1);

    expect(min3(3, 3, -1)).toBe(-1);

    expect(min3(3, 3, 4)).toBe(3);

    expect(min3(3, 0, 3)).toBe(0);

    expect(min3(3, 4, 3)).toBe(3);
});

test("quadratiCurve", ()=>{
    expect(quadraticCurve(2, 0.1, 0.2, 3)).toBe(11.3);

    expect(quadraticCurve(1, -1, -2, -3)).toBe(-3);

    expect(quadraticCurve(-1, -1, 0, 0)).toBe(-4);

    expect(quadraticCurve(-1, -1, 1, 0)).toBe(-8);

    expect(quadraticCurve(-1, 0, 0, 0)).toBe(0);
});

test("cubicCurve", ()=>{
    expect(cubicCurve(0, 1, 2, 3, 4)).toBe(1);

    expect(cubicCurve(0, 2, 3, 4, 5)).toBe(2);

    expect(cubicCurve(1,2,3,4,5)).toBe(5);

    expect(cubicCurve(1, 3, 4,5,6)).toBe(6);

    expect(cubicCurve(2, 2, 2, 2, 3)).toBe(10);
});

test("makeCubicCurve", ()=>{
    const f = makeCubicCurve(1, 2, 3, 4);
    expect(f(0)).toBe(1);

    expect(f(1)).toBe(4);
});

test("computeHashFloat", ()=>{
    expect(computeHashFloat(500)).toEqual(computeHashFloat(500));

    expect(computeHashFloat(500)).not.toEqual(computeHashFloat(400))
});

test("computeHashFloatArray", ()=>{
    expect(computeHashFloatArray([1, 2, 1.5], 1, 2)).
            toEqual(computeHashFloatArray([1,2,1.5], 1, 2));

    expect(computeHashFloatArray([1, 2, 1.5], 1, 3)).not.toEqual(computeHashFloatArray([1, 2, 1.5], 1, 2));

    expect(computeHashFloatArray([1, 2, 1.5], 2, 3)).not.
            toEqual(computeHashFloatArray([1, 2, 1.5], 1, 3));

    expect(computeHashFloatArray([1, 2, 3], 1, 3)).not.
            toEqual(computeHashFloatArray([1, 2, 1.5], 1, 3));
});


test('sign', () => {
    expect(sign(1)).toBe(1);

    expect(sign(-1)).toBe(-1);

    expect(sign(0)).toBe(0);

    expect(sign(2)).toBe(1);

    expect(sign(-2)).toBe(-1);
});

test('lerp', () => {
    expect(lerp(0, 5, 0.1)).toBe(0.5);

    expect(lerp(-5, 5, 0.5)).toBe(0);

    expect(lerp(0, 0, 0)).toBe(0);

    expect(lerp(0, 0, 1)).toBe(0);

    expect(lerp(1, 2, 0)).toBe(1);

    expect(lerp(1, 2, 1)).toBe(2);
});

test('inverseLerp', () => {
    expect(inverseLerp(0, 5, 0.5)).toBe(0.1);

    expect(inverseLerp(-5, 5, 0)).toBe(0.5);

    expect(inverseLerp(0, 0, 0)).toBe(0);

    expect(inverseLerp(1, 2, 1)).toBe(0);

    expect(inverseLerp(1, 2, 2)).toBe(1);
});

test('clamp', () => {
    expect(clamp(0, 0, 0)).toBe(0);

    expect(clamp(0, 1, 1)).toBe(1);

    expect(clamp(0, -1, -1)).toBe(-1);

    expect(clamp(3, 1, 2)).toBe(2);

    expect(clamp(0, 1, 2)).toBe(1);

    expect(clamp(2, 1, 3)).toBe(2);
});

test('copysign', () => {
    expect(copysign(1, 2)).toBe(1);
    expect(copysign(2, 1)).toBe(2);

    expect(copysign(2, -1)).toBe(-2);
    expect(copysign(-2, 1)).toBe(2);
    expect(copysign(-2, -1)).toBe(-2);

    expect(copysign(3, 7)).toBe(3);
    expect(copysign(3, -7)).toBe(-3);
});

test('computeWholeDivisorLow 1/1', () => {
    expect(computeWholeDivisorLow(1, 1)).toEqual(1);
});

test('computeWholeDivisorLow 16/5', () => {
    expect(computeWholeDivisorLow(16, 5)).toEqual(4);
});

test("isValueBetween", ()=>{
    expect(isValueBetween(0,1,2)).toBe(false);
} );

test("isValueBetween",() =>{
    expect(isValueBetween(1, -1, 2)).toBe(true);

    expect(isValueBetween(1, 2, -1)).toBe(true);
});

test("isValueBetweenInclusive", ()=>{
    expect(isValueBetweenInclusive(1,1,2)).toBe(true);

    expect(isValueBetweenInclusive(2,1,2)).toBe(true);

    expect(isValueBetweenInclusive(1.5,1,2)).toBe(true);

    expect(isValueBetweenInclusive(0.5,1,2)).toBe(false);

    expect(isValueBetweenInclusive(3,1,2)).toBe(false);
});


test("solveQuadratic", ()=>{
    expect(solveQuadratic(0,0,0)).toStrictEqual([0, 0]);

    expect(solveQuadratic(0,0,1)).toStrictEqual(null);

    expect(solveQuadratic(0,2,3)).toStrictEqual([-1.5, -1.5]);

    expect(solveQuadratic(1,-2,-3)).toStrictEqual([-1, 3]);

    expect(solveQuadratic(1,-2,3)).toBe(null);
});