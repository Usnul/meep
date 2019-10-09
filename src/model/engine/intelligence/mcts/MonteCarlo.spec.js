import { MonteCarloTreeSearch } from "./MonteCarlo";
import { StateType } from "./StateNode";
import Vector1 from "../../../core/geom/Vector1.js";

function cloneObject(o) {
    return o.clone();
}

function incrementVector1(v) {
    return v._add(1);
}

test("Simulator constructor doesn't throw", () => {
    new MonteCarloTreeSearch();
});

test("Simulator initialization", () => {
    const sim = new MonteCarloTreeSearch();

    function expand(s) {
        if (s < 3) {
            return [incrementVector1];
        }
    }

    sim.initialize({
        rootState: new Vector1(1),
        computeValidMoves: expand,
        computeTerminalFlag: v => v === 3,
        cloneState: cloneObject
    });

    expect(sim.computeValidMoves).toBe(expand);

    expect(sim.root).toBeDefined();

    expect(sim.rootState.getValue()).toBe(1);
});


test("Depth of exploration limit", () => {
    const sim = new MonteCarloTreeSearch();

    sim.maxExplorationDepth = 10;

    const expand = jest.fn(function (s) {
        return [incrementVector1];
    });


    sim.initialize({
        rootState: new Vector1(1),
        computeValidMoves: expand,
        computeTerminalFlag: v => StateType.Undecided,
        cloneState: cloneObject
    });

    sim.playout();

    expect(expand).toBeCalledTimes(10);
});

test("Single linear playout", () => {
    const sim = new MonteCarloTreeSearch();

    const expand = jest.fn(function (s) {
        return [incrementVector1];
    });

    function computeTerminalFlag(v) {
        return v.getValue() === 3 ? StateType.Tie : StateType.Undecided;
    }

    sim.initialize({
        rootState: new Vector1(1),
        computeValidMoves: expand,
        computeTerminalFlag,
        cloneState: cloneObject
    });

    sim.playout();

    expect(expand).toBeCalledTimes(2);

    expect(sim.root.moves.length).toBe(1);

    expect(sim.root.moves[0].target.moves.length).toBe(1);
});

function TTTState() {
    this.crossTurn = true;
    this.data = new Array(9);
    this.data.fill(-1);
}

TTTState.prototype.copy = function (other) {
    const data = this.data;
    const length = data.length;

    for (let i = 0; i < length; i++) {
        data[i] = other.data[i];
    }

    this.crossTurn = other.crossTurn;
};

TTTState.prototype.clone = function () {
    const result = new TTTState();
    result.copy(this);

    return result;
};

TTTState.prototype.playSquare = function (index) {
    this.data[index] = this.crossTurn ? 1 : 2;
    this.crossTurn = !this.crossTurn;
};

TTTState.prototype.countEmpty = function () {
    let result = 0;

    this.traverseEmpty(i => result++);

    return result;
};

TTTState.prototype.traverseEmpty = function (v) {
    const data = this.data;
    const length = data.length;

    for (let i = 0; i < length; i++) {
        if (data[i] === -1) {
            v(i);
        }
    }
};

TTTState.prototype.winingSide = function () {
    const data = this.data;

    function checkWin(offset, stride) {
        let prevValue = data[offset];

        let i;

        let count = 1;

        for (i = offset + stride; i < 9, count < 3; i += stride, count++) {
            const v = data[i];
            if (v !== prevValue) {
                return -1;
            } else {
                prevValue = v;
            }
        }

        return prevValue;
    }

    const conditions = [
        //horizontal
        [0, 1],
        [3, 1],
        [6, 1],
        //vertical
        [0, 3],
        [1, 3],
        [2, 3],
        //diagonal
        [0, 4],
        [2, 2]
    ];

    for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];

        const side = checkWin(condition[0], condition[1]);

        if (side !== -1) {
            return side;
        }
    }

    return -1;
};

test("10 steps through tic-tac-toe terminates", () => {
    const sim = new MonteCarloTreeSearch();

    const expand = jest.fn(function (s) {
        const result = [];

        s.traverseEmpty(index => {
            result.push((s) => {

                s.playSquare(index);

                return s;
            });
        });

        return result;
    });

    function computeTerminalFlag(s) {
        const winingSide = s.winingSide();


        if (winingSide === 1) {
            return StateType.Win;
        } else if (winingSide === 2) {
            return StateType.Loss;
        } else {
            const c = s.countEmpty();
            if (c === 0) {
                return StateType.Tie;
            } else {
                return StateType.Undecided;
            }
        }
    }

    const initialState = new TTTState();

    sim.initialize({
        rootState: initialState,
        computeValidMoves: expand,
        computeTerminalFlag,
        cloneState: cloneObject
    });


    for (let i = 0; i < 10; i++) {
        sim.playout();
    }


});