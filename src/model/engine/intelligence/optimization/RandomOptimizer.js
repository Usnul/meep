import { randomFromArray, seededRandom } from "../../../core/math/MathUtils.js";

/**
 * Hill climbing optimizer based on random moves
 * @template S
 * @class
 */
export class RandomOptimizer {

    /**
     * @template S
     */
    constructor() {
        /**
         *
         * @type {S}
         */
        this.state = null;

        /**
         *
         * @type {function(S):S}
         */
        this.cloneState = null;

        /**
         *
         * @type {function(S):Function[]}
         */
        this.computeValidActions = null;

        /**
         *
         * @type {function(S):number}
         */
        this.scoreFunction = null;


        /**
         *
         * @type {Function}
         */
        this.random = seededRandom(0);
    }

    /**
     *
     * @param {S} state
     * @param {function(S):Function[]} computeValidActions
     * @param {function(S):S} cloneState
     * @param {function(S):number} scoreFunction
     */
    initialize(
        {
            state,
            computeValidActions,
            cloneState,
            scoreFunction
        }
    ) {
        this.state = state;

        this.computeValidActions = computeValidActions;

        this.cloneState = cloneState;

        this.scoreFunction = scoreFunction;
    }

    /**
     * Perform a single optimization step
     * @returns {boolean} True if state was improved, false if no change has occurred
     */
    step() {
        const tempState = this.cloneState(this.state);

        const actions = this.computeValidActions(tempState);

        const numActions = actions.length;

        if (numActions === 0) {
            return false;
        }

        const currentScore = this.scoreFunction(this.state);


        const action = randomFromArray(actions, this.random);

        //mutate state
        action(tempState);

        const newScore = this.scoreFunction(tempState);

        if (newScore <= currentScore) {
            //score not improved
            return false;
        }

        //swap current state with the new one
        this.state = tempState;

        return true;
    }

    /**
     *
     * @param {number} tries
     * @returns {boolean}
     */
    stepThrough(tries) {
        for (let i = 0; i < tries; i++) {
            if (this.step()) {
                return true;
            }
        }

        return false;
    }
}
