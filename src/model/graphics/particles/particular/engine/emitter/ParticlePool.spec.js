import { ParticlePool } from "./ParticlePool.js";
import { ParticleAttributeType, ParticleDataType, } from "../../group/ParticleGroup.js";
import { ParticleSpecification } from "../../group/ParticleSpecification.js";
import { ParticleAttribute } from "../../group/ParticleAttribute.js";

/**
 *
 * @returns {ParticlePool}
 */
function samplePool() {
    const specification = new ParticleSpecification();
    specification.add(new ParticleAttribute('a', ParticleAttributeType.Scalar, ParticleDataType.Float32));
    specification.add(new ParticleAttribute('b', ParticleAttributeType.Vector4, ParticleDataType.Float32));

    const pool = new ParticlePool(specification);

    pool.build();

    return pool;
}

/**
 *
 * @param {ParticlePool} pool
 * @param {number} originalCount
 */
function populatePool(pool, originalCount) {
    let v = 0;

    for (let i = 0; i < originalCount; i++) {
        const ref = pool.create();

        pool.writeAttributeScalar(ref, 0, v++);

        pool.writeAttributeVector4(ref, 1,
            v++,
            v++,
            v++,
            v++
        );
    }
}

test('compaction method', () => {
    const pool = samplePool();

    populatePool(pool, 6);

    //poke 3 holes in the pool
    pool.remove(0);
    pool.remove(2);
    pool.remove(4);

    pool.compact();

    expect(pool.occupancy.size()).toBe(3);

    expect(pool.readAttributeScalar(0, 0)).toBe(25);
    expect(pool.readAttributeScalar(1, 0)).toBe(5);
    expect(pool.readAttributeScalar(2, 0)).toBe(15);

    const record = [];

    pool.readAttributeVector4(0, 1, record);
    expect(record).toEqual([26, 27, 28, 29]);

    pool.readAttributeVector4(1, 1, record);
    expect(record).toEqual([6, 7, 8, 9]);

    pool.readAttributeVector4(2, 1, record);
    expect(record).toEqual([16, 17, 18, 19]);
});

test('compaction method on empty', () => {
    const pool = samplePool();

    pool.compact();

    expect(pool.occupancy.size()).toBe(0);
});

test('compaction method [1] -> [0]', () => {
    const pool = samplePool();

    populatePool(pool, 1);

    //poke a hole in the pool
    pool.remove(0);

    pool.compact();

    expect(pool.occupancy.size()).toBe(0);
});

test('compaction method [1] -> [1]', () => {
    const pool = samplePool();

    populatePool(pool, 1);

    pool.compact();

    expect(pool.occupancy.size()).toBe(1);

    expect(pool.readAttributeScalar(0, 0)).toBe(0);

    const record = [];

    pool.readAttributeVector4(0, 1, record);
    expect(record).toEqual([1, 2, 3, 4]);
});

test('compaction method [1 1] -> [0 1]', () => {
    const pool = samplePool();

    populatePool(pool, 2);

    //poke a hole in the pool
    pool.remove(0);

    pool.compact();

    expect(pool.occupancy.size()).toBe(1);


    expect(pool.readAttributeScalar(0, 0)).toBe(5);

    const record = [];

    pool.readAttributeVector4(0, 1, record);
    expect(record).toEqual([6, 7, 8, 9]);
});

test('idempontency of compaction method [1 1] -> [0 1]', () => {
    const pool = samplePool();

    populatePool(pool, 2);

    //poke a hole in the pool
    pool.remove(0);

    pool.compact();
    pool.compact();

    expect(pool.occupancy.size()).toBe(1);


    expect(pool.readAttributeScalar(0, 0)).toBe(5);

    const record = [];

    pool.readAttributeVector4(0, 1, record);
    expect(record).toEqual([6, 7, 8, 9]);
});

test('compaction method [1 1] -> [1 0]', () => {
    const pool = samplePool();

    populatePool(pool, 2);

    //poke a hole in the pool
    pool.remove(1);

    pool.compact();

    expect(pool.occupancy.size()).toBe(1);


    expect(pool.readAttributeScalar(0, 0)).toBe(0);

    const record = [];

    pool.readAttributeVector4(0, 1, record);
    expect(record).toEqual([1, 2, 3, 4]);
});


test('read/write scalar attribute', () => {
    const pool = samplePool();

    populatePool(pool, 2);

    expect(pool.readAttributeScalar(1, 0)).toBe(5);

    pool.writeAttributeScalar(1, 0, 42);

    expect(pool.readAttributeScalar(1, 0)).toBe(42);
});