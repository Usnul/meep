import { ParticleEmitter } from "./ParticleEmitter.js";
import { ParticleEmitterFlag } from "./ParticleEmitterFlag.js";

test('all flags: set, clear, get', () => {
    const p = new ParticleEmitter();


    Object.values(ParticleEmitterFlag).forEach(flag => {

        p.clearFlag(flag);

        expect(p.getFlag(flag)).toBe(false);

        p.setFlag(flag);

        expect(p.getFlag(flag)).toBe(true);

        p.clearFlag(flag);

        expect(p.getFlag(flag)).toBe(false);
    });

});

test('flag must not interfere with one another',()=>{

    const p = new ParticleEmitter();

    p.setFlag(1);
    p.setFlag(2);
    p.setFlag(4);
    p.setFlag(32);

    expect(p.getFlag(1)).toBe(true);
    expect(p.getFlag(2)).toBe(true);
    expect(p.getFlag(4)).toBe(true);
    expect(p.getFlag(8)).toBe(false);
    expect(p.getFlag(32)).toBe(true);

    p.clearFlag(2);

    expect(p.getFlag(1)).toBe(true);
    expect(p.getFlag(2)).toBe(false);
    expect(p.getFlag(4)).toBe(true);
    expect(p.getFlag(8)).toBe(false);
    expect(p.getFlag(32)).toBe(true);
});