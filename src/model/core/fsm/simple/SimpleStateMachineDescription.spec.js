import { SimpleStateMachineDescription } from "./SimpleStateMachineDescription.js";

test('stateExists', () => {
    const s = new SimpleStateMachineDescription();

    expect(s.stateExists(0)).toBe(false);

    s.createState(0);

    expect(s.stateExists(0)).toBe(true);
});

test('getOutgoingStates', () => {
    const smd = new SimpleStateMachineDescription();

    const a = smd.createState();
    const b = smd.createState();
    const c = smd.createState();

    expect(smd.getOutgoingStates(a)).toEqual([]);
    expect(smd.getOutgoingStates(b)).toEqual([]);
    expect(smd.getOutgoingStates(c)).toEqual([]);

    smd.createEdge(a, b);

    expect(smd.getOutgoingStates(a)).toEqual([b]);
    expect(smd.getOutgoingStates(b)).toEqual([]);
    expect(smd.getOutgoingStates(c)).toEqual([]);

    smd.createEdge(a, c);

    expect(smd.getOutgoingStates(a)).toEqual([b, c]);
    expect(smd.getOutgoingStates(b)).toEqual([]);
    expect(smd.getOutgoingStates(c)).toEqual([]);

    smd.createEdge(c, a);

    expect(smd.getOutgoingStates(a)).toEqual([b, c]);
    expect(smd.getOutgoingStates(b)).toEqual([]);
    expect(smd.getOutgoingStates(c)).toEqual([a]);
});

test('getIncomingStates', () => {
    const smd = new SimpleStateMachineDescription();

    const a = smd.createState();
    const b = smd.createState();
    const c = smd.createState();

    expect(smd.getIncomingStates(a)).toEqual([]);
    expect(smd.getIncomingStates(b)).toEqual([]);
    expect(smd.getIncomingStates(c)).toEqual([]);

    smd.createEdge(a, b);

    expect(smd.getIncomingStates(a)).toEqual([]);
    expect(smd.getIncomingStates(b)).toEqual([a]);
    expect(smd.getIncomingStates(c)).toEqual([]);

    smd.createEdge(a, c);

    expect(smd.getIncomingStates(a)).toEqual([]);
    expect(smd.getIncomingStates(b)).toEqual([a]);
    expect(smd.getIncomingStates(c)).toEqual([a]);

    smd.createEdge(c, a);

    expect(smd.getIncomingStates(a)).toEqual([c]);
    expect(smd.getIncomingStates(b)).toEqual([a]);
    expect(smd.getIncomingStates(c)).toEqual([a]);
});
