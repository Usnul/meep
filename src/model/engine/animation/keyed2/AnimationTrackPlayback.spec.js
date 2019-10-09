import AnimationTrack from "./AnimationTrack";
import AnimationTrackPlayback from "./AnimationTrackPlayback";
import TransitionFunctions from "../TransitionFunctions";

function makeSingleKeyTrack() {
    const t = new AnimationTrack(["a"]);

    t.addKey(0, [7]);

    return t;
}

function makeTwoKeyTransitionTrack() {
    const t = new AnimationTrack(["a"]);

    t.addKey(0, [5]);
    t.addKey(1, [3]);

    t.addTransition(0, TransitionFunctions.Linear);

    return t;
}


test("calling advance(0) twice results in no change", () => {
    const t = makeTwoKeyTransitionTrack();
    const updateCallback = jest.fn();

    const playback = new AnimationTrackPlayback(t, updateCallback, null);

    expect(playback.position).toBe(0);

    playback.advance(0);

    expect(updateCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenLastCalledWith(5);
    expect(playback.position).toBe(0);

    playback.advance(0);

    expect(updateCallback).toHaveBeenCalledTimes(2);
    expect(updateCallback).toHaveBeenLastCalledWith(5);
    expect(playback.position).toBe(0);
});

test("calling advance(0) results in no change", () => {
    const t = makeTwoKeyTransitionTrack();
    const updateCallback = jest.fn();

    const playback = new AnimationTrackPlayback(t, updateCallback, null);

    expect(playback.position).toBe(0);

    playback.advance(0);

    expect(playback.position).toBe(0);
    expect(updateCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenLastCalledWith(5);
});

test("advancing past last key results in last key being held", () => {

    const t = makeTwoKeyTransitionTrack();
    const updateCallback = jest.fn();

    const playback = new AnimationTrackPlayback(t, updateCallback, null);

    playback.advance(2);

    expect(updateCallback).toHaveBeenLastCalledWith(3);
});

test("playback starts at position 0 by default", () => {
    const t = makeSingleKeyTrack();
    const updateCallback = jest.fn();

    const playback = new AnimationTrackPlayback(t, updateCallback, null);

    expect(playback.position).toBe(0);
});

test("single static key playback works", () => {
    const t = makeSingleKeyTrack();

    const updateCallback = jest.fn();

    const playback = new AnimationTrackPlayback(t, updateCallback, null);

    playback.advance(1);

    expect(updateCallback).toHaveBeenCalledTimes(1);
    expect(updateCallback).toHaveBeenLastCalledWith(7);
});