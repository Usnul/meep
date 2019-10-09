/*
 * Inspired by wikipedia article on Monte Carlo tree search: https://en.m.wikipedia.org/wiki/Monte_Carlo_tree_search
 * @author Alex Goldring 2018/06/18
 */


import { StateNode, StateType } from "./StateNode";
import { MoveEdge } from "./MoveEdge";
import { assert } from "../../../core/assert.js";
import { mix, seededRandom } from "../../../core/math/MathUtils.js";
import { returnZero } from "../../../core/function/Functions.js";

/**
 * @template S
 * @param {StateNode} node
 * @param {S} state
 */
function recordArbitratedPlayout(node, state) {
    node.addPlayouts(1, 0, 0);
}

/**
 * From: A Survey of Monte Carlo Tree Search Methods
 * The value Cp = 1/√2 was shown by Kocsis and Szepesvari [120] to satisfy the Hoeffding ineqality with rewards in the range [0, 1]
 * @type {number}
 */
const C_ks = 1 / Math.sqrt(2);

/**
 *
 * @param {StateNode} parent
 * @param {StateNode} child
 * @returns {number}
 */
function computeNodeSelectionScore(parent, child) {
    // Exploitation heuristic
    const Q = mix((child.wins + 1) / child.playouts, child.heuristicValue, 0.65);

    // Based on UCB1
    // exploration heuristic
    const u = Math.sqrt((2 * Math.log(parent.playouts)) / (child.playouts + 1));

    return Q + C_ks * u;
}

/**
 * @template S
 */
export class MonteCarloTreeSearch {
    /**
     *
     * @constructor
     */
    constructor() {
        /**
         *
         * @type {S}
         */
        this.rootState = null;
        /**
         *
         * @type {StateNode|null}
         */
        this.root = null;

        /**
         *
         * @type {function(state:S, source:StateNode):Function[]}
         */
        this.computeValidMoves = null;

        /**
         *
         * @type {function(state:S):StateType}
         */
        this.computeTerminalFlag = null;

        /**
         * Depth to which plays will be explored
         * @type {number}
         */
        this.maxExplorationDepth = 1000;

        /**
         *
         * @type {Function}
         */
        this.random = seededRandom(0);
    }

    /**
     * @param {S} rootState
     * @param {function(state:S, source:StateNode):Function[]} computeValidMoves
     * @param {function(state:S):StateType} computeTerminalFlag
     * @param {function(S):S} cloneState
     * @param {function(StateNode, S):number} heuristic Estimation function for evaluation of intermediate stated, guides exploration
     */
    initialize(
        {
            rootState,
            computeValidMoves,
            computeTerminalFlag,
            cloneState,
            heuristic = returnZero
        }
    ) {
        assert.equal(typeof computeValidMoves, 'function', `computeValidMoves must be a function, instead was '${typeof computeValidMoves}'`);
        assert.equal(typeof computeTerminalFlag, 'function', `computeTerminalFlag must be a function, instead was '${typeof computeTerminalFlag}'`);
        assert.equal(typeof cloneState, 'function', `cloneState must be a function, instead was '${typeof cloneState}'`);

        this.computeValidMoves = computeValidMoves;
        this.computeTerminalFlag = computeTerminalFlag;
        this.cloneState = cloneState;
        this.heuristic = heuristic;

        this.rootState = rootState;

        this.root = new StateNode();
    }

    /**
     *
     * @param {StateNode} node
     * @param {S} state
     * @returns {StateNode}
     */
    selectRandom(node, state) {
        let score;

        let i, bestScore, bestMove;

        const random = this.random;

        while (
            node.isExpanded() &&
            node.moves.length > 0 &&
            !node.isTerminal()
            ) {

            bestScore = Number.NEGATIVE_INFINITY;
            bestMove = null;

            const moves = node.moves;

            const numMoves = moves.length;

            assert.notEqual(numMoves, 0, 'number of moves is 0, this is invalid state');

            for (i = 0; i < numMoves; i++) {

                const move = moves[i];

                const randomRoll = random();

                if (move.isTargetMaterialized()) {

                    const child = move.target;

                    const s = computeNodeSelectionScore(node, child);

                    assert.notEqual(Number.isNaN(s), 'computed Node score is NaN');
                    assert.ok(Number.isFinite(s), `computed Node score is not finite(=${s})`);

                    score = s + randomRoll;

                } else {

                    //use a constant value for unexplored nodes
                    score = randomRoll * 100;

                }


                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }

            }

            if (!bestMove.isTargetMaterialized()) {
                //materialize the target state
                materializedEdgeTarget(state, node, bestMove, this.computeTerminalFlag, this.heuristic);

            } else {
                //just follow the edge
                bestMove.move(state);
            }

            node = bestMove.target;
        }


        return node;
    }

    /**
     * Perform a playout from the root node
     * @returns {S} final state of the playout
     */
    playout() {
        const computeValidMoves = this.computeValidMoves;

        const computeTerminalFlag = this.computeTerminalFlag;

        const state = this.cloneState(this.rootState);

        assert.notEqual(state, this.rootState, 'cloneState must produce a new state object, instead it produced the same one');

        let node = this.root;

        while (!node.isTerminal() && node.depth < this.maxExplorationDepth) {

            if (!node.isExpanded()) {
                node.expand(state, computeValidMoves, computeTerminalFlag);
            }

            const child = this.selectRandom(node, state);

            if (child === node) {
                // prevent infinite recursion
                // this should not happen?
                break;
            }

            node = child;
        }

        if (!node.isTerminal() && node.depth >= this.maxExplorationDepth) {
            //cap the state by depth, propagate heuristic score
            node.type = StateType.DepthCapped;
            recordArbitratedPlayout(node, state);
        }

        return state;
    }
}

/**
 * @template S
 * @param {S} state
 * @param {StateNode} source
 * @param {MoveEdge} edge
 * @param {function(S):StateType} computeTerminalFlag
 * @param {function(StateNode, S)} heuristic
 */
function materializedEdgeTarget(state, source, edge, computeTerminalFlag, heuristic) {
    const move = edge.move;

    const child = new StateNode();
    child.parent = source;
    child.depth = source.depth + 1;

    const computedState = move(state);

    const terminalFlag = computeTerminalFlag(computedState);

    assert.notEqual(Object.values(StateType).indexOf(terminalFlag), -1, `Invalid terminal flag value '${terminalFlag}', expected value from set: {${Object.values(StateType).join(',')}}`);

    child.type = terminalFlag;

    edge.target = child;

    const childHeuristicScore = heuristic(child, computedState);

    assert.notOk(Number.isNaN(childHeuristicScore), 'heuristic returned NaN');

    child.heuristicValue = childHeuristicScore;

    if (terminalFlag === StateType.Undecided) {
        //do nothing
    } else {


        if (terminalFlag === StateType.Win) {
            child.addPlayouts(1, 1, 0);
        } else if (terminalFlag === StateType.Loss) {
            child.addPlayouts(1, 0, 1);
        } else if (terminalFlag === StateType.Tie || terminalFlag === StateType.DepthCapped) {
            child.addPlayouts(1, 0, 0);
        }
    }

    return computedState;
}

