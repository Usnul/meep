import { Sampler2D } from "./Sampler2D.js";
import { computeUnsignedDistanceField } from "./distanceField.js";
import { randomIntegerBetween, seededRandom } from "../../../core/math/MathUtils.js";

describe('computeUnsignedDistanceField', () => {
    test('empty', () => {
        const source = Sampler2D.uint8(1, 0, 0);
        const target = Sampler2D.uint8(1, 0, 0);

        computeUnsignedDistanceField(source, target, 0);
    });

    test('1 pixel empty source', () => {
        const source = Sampler2D.uint8(1, 1, 1);
        const target = Sampler2D.uint8(1, 1, 1);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(255);
    });

    test('1 pixel filled source', () => {
        const source = Sampler2D.uint8(1, 1, 1);
        source.set(0, 0, [255]);

        const target = Sampler2D.uint8(1, 1, 1);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(0);
    });

    test('3x3 pixel source with filled middle', () => {
        const source = Sampler2D.uint8(1, 3, 3);
        source.set(1, 1, [255]);

        const target = Sampler2D.uint8(1, 3, 3);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(1);
        expect(target.getNearest(1, 0)).toBe(1);
        expect(target.getNearest(2, 0)).toBe(1);

        expect(target.getNearest(0, 1)).toBe(1);
        expect(target.getNearest(1, 1)).toBe(0);
        expect(target.getNearest(2, 1)).toBe(1);

        expect(target.getNearest(0, 2)).toBe(1);
        expect(target.getNearest(1, 2)).toBe(1);
        expect(target.getNearest(2, 2)).toBe(1);
    });

    test('3x3 pixel source with empty middle', () => {
        const source = Sampler2D.uint8(1, 3, 3);
        source.data.fill(255);
        source.set(1, 1, [0]);

        const target = Sampler2D.uint8(1, 3, 3);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(0);
        expect(target.getNearest(1, 0)).toBe(0);
        expect(target.getNearest(2, 0)).toBe(0);

        expect(target.getNearest(0, 1)).toBe(0);
        expect(target.getNearest(1, 1)).toBe(1);
        expect(target.getNearest(2, 1)).toBe(0);

        expect(target.getNearest(0, 2)).toBe(0);
        expect(target.getNearest(1, 2)).toBe(0);
        expect(target.getNearest(2, 2)).toBe(0);
    });

    test('3x3 pixel source with empty corners', () => {
        const source = Sampler2D.uint8(1, 3, 3);
        source.data.fill(255);
        source.set(0, 0, [0]);
        source.set(2, 0, [0]);
        source.set(0, 2, [0]);
        source.set(2, 2, [0]);

        const target = Sampler2D.uint8(1, 3, 3);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(1);
        expect(target.getNearest(1, 0)).toBe(0);
        expect(target.getNearest(2, 0)).toBe(1);

        expect(target.getNearest(0, 1)).toBe(0);
        expect(target.getNearest(1, 1)).toBe(0);
        expect(target.getNearest(2, 1)).toBe(0);

        expect(target.getNearest(0, 2)).toBe(1);
        expect(target.getNearest(1, 2)).toBe(0);
        expect(target.getNearest(2, 2)).toBe(1);
    });

    test('3x3 pixel source with filled corners', () => {
        const source = Sampler2D.uint8(1, 3, 3);
        source.data.fill(0);
        source.set(0, 0, [255]);
        source.set(2, 0, [255]);
        source.set(0, 2, [255]);
        source.set(2, 2, [255]);

        const target = Sampler2D.uint8(1, 3, 3);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(0);
        expect(target.getNearest(1, 0)).toBe(1);
        expect(target.getNearest(2, 0)).toBe(0);

        expect(target.getNearest(0, 1)).toBe(1);
        expect(target.getNearest(1, 1)).toBe(1);
        expect(target.getNearest(2, 1)).toBe(1);

        expect(target.getNearest(0, 2)).toBe(0);
        expect(target.getNearest(1, 2)).toBe(1);
        expect(target.getNearest(2, 2)).toBe(0);
    });

    test('3x1 pixel source with 1 filled corner', () => {
        const source = Sampler2D.uint8(1, 3, 1);
        source.data.fill(0);
        source.set(0, 0, [255]);

        const target = Sampler2D.uint8(1, 3, 1);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(0);
        expect(target.getNearest(1, 0)).toBe(1);
        expect(target.getNearest(2, 0)).toBe(2);
    });

    test('3x3 pixel source with 1 filled corner', () => {
        const source = Sampler2D.uint8(1, 3, 3);
        source.data.fill(0);
        source.set(0, 0, [255]);

        const target = Sampler2D.uint8(1, 3, 3);

        computeUnsignedDistanceField(source, target, 0);

        expect(target.getNearest(0, 0)).toBe(0);
        expect(target.getNearest(1, 0)).toBe(1);
        expect(target.getNearest(2, 0)).toBe(2);

        expect(target.getNearest(0, 1)).toBe(1);
        expect(target.getNearest(1, 1)).toBe(1);
        expect(target.getNearest(2, 1)).toBe(2);

        expect(target.getNearest(0, 2)).toBe(2);
        expect(target.getNearest(1, 2)).toBe(2);
        expect(target.getNearest(2, 2)).toBe(2);
    });

    test('performance', () => {
        const sizeX = 100;
        const sizeY = 100;

        const source = Sampler2D.uint8(1, sizeX, sizeY);

        const random = seededRandom(42);
        source.data.fill(0);
        for (let i = 0; i < source.data.length * 0.1; i++) {
            const x = randomIntegerBetween(random, 0, sizeX);
            const y = randomIntegerBetween(random, 0, sizeY);
            source.set(x, y, [255]);
        }

        const target = Sampler2D.uint8(1, sizeX, sizeY);

        console.time('p');
        computeUnsignedDistanceField(source, target, 0);
        console.timeEnd('p');

    });
});