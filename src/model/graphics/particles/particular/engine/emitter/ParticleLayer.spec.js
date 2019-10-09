import { EmissionFromType, EmissionShapeType, ParticleLayer } from "./ParticleLayer.js";
import { ParameterLookupTable } from "../parameter/ParameterLookupTable.js";
import { ParameterTrack } from "../parameter/ParameterTrack.js";
import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";

function sampleA() {
    const layer0 = new ParticleLayer();
    layer0.position.set(1.5, 2.6, 3.7);
    layer0.particleSize.set(0.09, 0.13);
    layer0.emissionShape = EmissionShapeType.Sphere;
    layer0.emissionFrom = EmissionFromType.Volume;
    layer0.scale.set(0.37, 0.7, 0.37);
    layer0.emissionImmediate = 16;
    layer0.particleLife.set(1.4, 2.3);

    layer0.particleSpeed.set(0.42, 0.6);
    layer0.particleVelocityDirection.direction.set(0, 1, 0);
    layer0.particleVelocityDirection.angle = 0;

    layer0.imageURL = "data/textures/particle/travnik/plus_2.png";

    const layer0colorLUT = new ParameterLookupTable(4);

    layer0colorLUT.write(new Float32Array([
        0, 1, 0, 0.3,
        0, 1, 0, 0.7,
        0, 1, 0, 0.5,
        0, 1, 0, 0
    ]), new Float32Array([0, 0.2, 0.8, 1]));

    layer0.parameterTracks.add(new ParameterTrack('color', layer0colorLUT));

    const layer0scaleLUT = new ParameterLookupTable(1);

    layer0scaleLUT.write(new Float32Array([
        1,
        1.3
    ]), new Float32Array([0, 1]));

    layer0.parameterTracks.add(new ParameterTrack('scale', layer0scaleLUT));

    return layer0;
}


test('BinaryBuffer serialization consistency', () => {
    const buffer = new BinaryBuffer();


    const expected = sampleA();

    expected.toBinaryBuffer(buffer);

    buffer.position = 0;

    const actual = new ParticleLayer();

    actual.fromBinaryBuffer(buffer);

    expect(actual.imageURL).toEqual(expected.imageURL);
    expect(actual.particleLife.equals(expected.particleLife)).toBe(true);
    expect(actual.particleSize.equals(expected.particleSize)).toBe(true);

    expect(actual.emissionShape).toBe(expected.emissionShape);
    expect(actual.emissionFrom).toBe(expected.emissionFrom);
    expect(actual.emissionRate).toBe(expected.emissionRate);
    expect(actual.emissionImmediate).toBe(expected.emissionImmediate);
    expect(actual.parameterTracks.equals(expected.parameterTracks)).toBe(true);
    expect(actual.position.roughlyEquals(expected.position)).toBe(true);
    expect(actual.scale.roughlyEquals(expected.scale)).toBe(true);
    expect(actual.particleVelocityDirection.roughlyEquals(expected.particleVelocityDirection)).toBe(true);
    expect(actual.particleSpeed.equals(expected.particleSpeed)).toBe(true);
});
