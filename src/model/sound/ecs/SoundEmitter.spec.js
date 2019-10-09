import { BinaryBuffer } from "../../core/binary/BinaryBuffer.js";
import { SoundEmitter, SoundEmitterSerializationAdapter, SoundTrack } from "./SoundEmitter.js";

test('binary serialization consistency', () => {
    const buffer = new BinaryBuffer();

    const emitter0 = new SoundEmitter();

    emitter0.channel = 'hello kitty';
    emitter0.isPositioned = true;
    emitter0.distanceMin = 3.1;
    emitter0.distanceMax = 7.5;
    emitter0.distanceRolloff = 11.6;
    emitter0.volume.set(0.89);

    const soundTrack = new SoundTrack();
    soundTrack.startWhenReady = true;
    soundTrack.playing = false;
    soundTrack.channel = "trek";
    soundTrack.time = 13.1;
    soundTrack.loop = false;

    soundTrack.url = "wow://such/path/much.slash";

    emitter0.tracks.add(soundTrack);

    const adapter = new SoundEmitterSerializationAdapter();

    adapter.initialize();
    adapter.serialize(buffer, emitter0);

    buffer.position = 0;

    const emitter1 = new SoundEmitter();

    adapter.deserialize(buffer, emitter1);

    expect(emitter1.channel).toEqual(emitter0.channel);
    expect(emitter1.isPositioned).toEqual(emitter0.isPositioned);

    expect(emitter1.distanceMin).toEqual(emitter0.distanceMin);
    expect(emitter1.distanceMax).toEqual(emitter0.distanceMax);

    expect(emitter1.distanceRolloff).toEqual(emitter0.distanceRolloff);

    expect(emitter1.volume.getValue()).toEqual(emitter0.volume.getValue());

    expect(emitter1.tracks.equals(emitter0.tracks));
});
