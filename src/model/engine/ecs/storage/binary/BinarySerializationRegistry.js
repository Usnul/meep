import { Graph } from "../../../../core/graph/Graph.js";
import { assert } from "../../../../core/assert.js";

export class BinarySerializationRegistry {
    constructor() {
        /**
         * @readonly
         * @private
         * @type {Map<string, Graph<BinaryClassUpgrader>>}
         */
        this.upgraders = new Map();
        /**
         * @readonly
         * @private
         * @type {Map<string, BinaryClassSerializationAdapter>}
         */
        this.serializers = new Map();
    }

    /**
     *
     * @param {BinaryClassSerializationAdapter[]} adapters
     */
    registerAdapters(adapters) {
        adapters.forEach(adapter => {
            this.registerAdapter(adapter);
        });
    }

    /**
     *
     * @param {string} [className]
     * @param {BinaryClassSerializationAdapter} adapter
     * @returns {boolean}
     */
    registerAdapter(adapter, className) {
        assert.notEqual(adapter, undefined, 'adapter is undefined');

        if (className === undefined) {
            const klass = adapter.getClass();

            if (typeof klass.typeName === "string") {
                className = klass.typeName;
            } else {
                throw new Error(`className not specified, could not infer class name from the class itself`);
            }
        }

        if (this.serializers.has(className)) {
            //a serializer already exists

            console.warn(`Serializer for class '${className}' already exists, ignoring request`);

            return false;
        }

        this.serializers.set(className, adapter);

        return true;
    }

    /**
     *
     * @param {string} className
     * @returns {BinaryClassSerializationAdapter}
     */
    removeAdapter(className) {
        const adapter = this.serializers.get(className);

        if (adapter !== undefined) {
            this.serializers.delete(className);
        }

        return adapter;
    }

    /**
     *
     * @param {string} className
     * @returns {BinaryClassSerializationAdapter|undefined}
     */
    getAdapter(className) {
        return this.serializers.get(className);
    }

    /**
     *
     * @param {string} className
     * @param {BinaryClassUpgrader} upgrader
     * @returns {boolean}
     */
    registerUpgrader(className, upgrader) {
        let classUpgraders = this.upgraders.get(className);

        if (classUpgraders === undefined) {
            classUpgraders = new Graph();

            this.upgraders.set(className, classUpgraders);
        }

        if (classUpgraders.hasNode(upgrader)) {
            //upgrader already registered
            return false;
        }

        classUpgraders.addNode(upgrader);

        //find other upgraders that would connect to this upgrader
        classUpgraders.traverseNodes(u => {
            if (u === upgrader) {
                return;
            }

            if (u.getStartVersion() === upgrader.getTargetVersion()) {
                classUpgraders.createEdge(u, upgrader);
            } else if (u.getTargetVersion() === upgrader.getStartVersion()) {
                classUpgraders.createEdge(upgrader, u);
            }
        });

        return true;
    }

    /**
     *
     * @param {string} className
     * @param {number} startVersion
     * @param {number} goalVersion
     * @returns {BinaryClassUpgrader[]}
     */
    getUpgradersChain(className, startVersion, goalVersion) {
        if (startVersion === goalVersion) {
            //already at the goal version
            return [];
        }

        const classUpgraders = this.upgraders.get(className);

        if (classUpgraders === undefined) {
            throw new Error(`No upgraders available for class '${className}'`);
        }

        const starts = [];
        const goals = [];

        classUpgraders.traverseNodes(n => {
            if (n.getStartVersion() === startVersion) {
                starts.push(n);
            }

            if (n.getTargetVersion() === goalVersion) {
                goals.push(n);
            }
        });

        let bestPath = null;
        let bestPathLength = Number.POSITIVE_INFINITY;

        for (let s = 0, sL = starts.length; s < sL; s++) {
            const start = starts[s];

            for (let g = 0, gL = goals.length; g < gL; g++) {
                const goal = goals[g];

                const path = classUpgraders.findPath(start, goal);

                if (path !== null) {

                    const pathLength = path.length;

                    if (bestPathLength > pathLength) {
                        //new best path found

                        bestPath = path;
                        bestPathLength = pathLength;

                    }
                }
            }
        }

        return bestPath;
    }

}
