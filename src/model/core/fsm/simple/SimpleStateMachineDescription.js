import { BitSet } from "../../binary/BitSet.js";
import { assert } from "../../assert.js";

export class SimpleStateMachineDescription {
    constructor() {
        this.__states = new BitSet();

        this.__edges = [];

        this.__actions = [];
    }

    /**
     *
     * @param {function(state:number)} visitor
     * @param {*} [thisArg]
     */
    traverseStates(visitor, thisArg) {
        const states = this.__states;
        for (let i = states.nextSetBit(0); i !== -1; i = states.nextSetBit(i + 1)) {
            visitor.call(thisArg, i);
        }
    }

    /**
     *
     * @param {number} s
     * @returns {boolean}
     */
    stateExists(s) {
        assert.typeOf(s, 'number', 'state');

        return this.__states.get(s);
    }

    /**
     *
     * @param {number} a
     * @param {number} b
     * @returns {boolean}
     */
    edgeExists(a, b) {
        assert.ok(this.stateExists(a), `starting state ${a} doesn't exist`);
        assert.ok(this.stateExists(b), `ending state ${b} doesn't exist`);

        const targetStates = this.__edges[a];

        if (targetStates === undefined) {
            return false;
        }

        return targetStates.indexOf(b) !== -1;
    }

    /**
     * @param {number} [id]
     * @returns {number}
     */
    createState(id = this.__states.nextClearBit(0)) {
        assert.typeOf(id, 'number', 'id');
        assert.ok(!this.stateExists(id), `state ${id} already exist`);

        this.__states.set(id, true);

        return id;
    }

    /**
     *
     * @param {number} a
     * @param {number} b
     */
    createEdge(a, b) {
        assert.ok(this.stateExists(a), `state ${a} doesn't exist`);
        assert.ok(this.stateExists(b), `state ${b} doesn't exist`);
        assert.notOk(this.edgeExists(a, b), `Edge '${a}' -> '${b}' already exists`);

        const edges = this.__edges;

        const targetStates = edges[a];

        if (targetStates === undefined) {
            edges[a] = [b]
        } else {
            targetStates.push(b);
        }
    }

    /**
     *
     * @param {number} state
     * @param {function} logic
     */
    setAction(state, logic) {
        assert.ok(this.stateExists(state), `state ${state} doesn't exist`);
        assert.equal(typeof logic, 'function', `logic must be a function, instead was '${typeof logic}'`)

        this.__actions[state] = logic;
    }

    /**
     *
     * @param {number} state
     * @returns {number[]} state IDs
     */
    getOutgoingStates(state) {
        assert.ok(this.stateExists(state), `state ${state} doesn't exist`);

        const result = this.__edges[state];

        if (result === undefined) {
            return [];
        }

        return result;
    }

    /**
     *
     * @param {number} state
     * @returns {number[]} state IDs
     */
    getIncomingStates(state) {
        assert.ok(this.stateExists(state), `state ${state} doesn't exist`);

        const result = [];
        for (let s in this.__edges) {
            const sId = parseInt(s);

            const targets = this.__edges[sId];

            if (targets.indexOf(state) !== -1) {
                result.push(sId);
            }
        }

        return result;
    }

    /**
     *
     * @param {number} start
     * @param {number} goal
     * @returns {number[]}
     */
    findPath(start, goal) {
        assert.ok(this.stateExists(start), `start state ${start} doesn't exist`);
        assert.ok(this.stateExists(goal), `goal state ${goal} doesn't exist`);

        const open = new Set();
        open.add(start);

        const closed = new Set();

        const cameFrom = new Map();

        function constructPath() {
            const result = [];
            let c = goal;
            do {
                result.unshift(c);
                c = cameFrom.get(c);
            } while (c !== undefined);

            return result;
        }

        const graph = this;

        function expandNode(current) {
            const outgoingStates = graph.getOutgoingStates(current);

            const l = outgoingStates.length;

            for (let i = 0; i < l; i++) {
                const node = outgoingStates[i];

                if (closed.has(node)) {
                    continue;
                }

                if (open.has(node)) {
                    continue;
                }

                open.add(node);
                cameFrom.set(node, current);
            }

        }

        while (open.size > 0) {
            const current = open.values().next().value;
            if (current === goal) {
                //reached the goal
                return constructPath();
            }
            open.delete(current);
            closed.add(current);

            //expand node
            expandNode(current);
        }

        //no path found
        return null;
    }
}
