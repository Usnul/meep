/**
 * Created by Alex on 29/01/14.
 */


import Signal from '../events/signal/Signal.js';
import { assert } from "../assert.js";
import { Edge } from "./Edge.js";

/**
 * @callback Graph~visitor
 * @param {*} node
 * @param {Edge} edge
 * @returns {boolean|undefined} if false is returned, traversal should stop
 */

/**
 * @template N
 */
export class Graph {
    /**
     * @template N
     * @constructor
     */
    constructor() {
        /**
         *
         * @type {Array<N>}
         */
        this.nodes = [];
        /**
         *
         * @type {Array<Edge<N>>}
         */
        this.edges = [];
        this.onChange = new Signal();
    }

    /**
     *
     * @param {N} start
     * @param {N} goal
     * @returns {Array<N>|null} nodes from start to goal in the shortest path including both start and goal.
     */
    findPath(start, goal) {
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
            graph.traverseSuccessors(current, function (node, edge) {
                if (closed.has(node)) {
                    return;
                }
                if (open.has(node)) {
                    return;
                }
                open.add(node);
                cameFrom.set(node, current);
            });
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

    /**
     * Returns true if there is an edge between two given nodes on this graph
     * @param {N} node1
     * @param {N} node2
     * @returns {boolean}
     */
    isEdgeBetween(node1, node2) {
        if (!this.containsNode(node1) || !this.containsNode(node2)) {
            return false; // one or both nodes are not part of the graph
        }
        const connectingEdge = this.findConnectingEdge(node1, node2);
        return connectingEdge !== null;
    }

    /**
     * Strictly traversable edge exists from source to target
     * @param {N} source
     * @param {N} target
     * @returns {boolean}
     */
    edgeExists(source, target) {
        if (!this.containsNode(source) || !this.containsNode(target)) {
            return false; // one or both nodes are not part of the graph
        }

        return this.traversePredecessors(source, function (destination) {
            if (destination === target) {
                //terminate traversal, this will make "traversePredecessors" return true also
                return false;
            }
        });
    }

    /**
     *
     * @param {function(node:N):boolean} visitor
     * @param {*} [thisArg]
     */
    traverseNodes(visitor, thisArg) {
        const nodes = this.nodes;
        const l = nodes.length;
        for (let i = 0; i < l; i++) {
            const node = nodes[i];
            if (visitor.call(thisArg, node) === false) {
                return;
            }
        }
    }

    /**
     *
     * @param {N} node
     * @param {Graph~visitor} visitor
     */
    traverseSuccessors(node, visitor) {
        const edges = this.edges;
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            const first = edge.first;
            const second = edge.second;

            if (first === node && edge.traversableForward()) {
                if (visitor(second, edge) === false) {
                    //terminate traversal if visitor returns false
                    return;
                }
            } else if (second === node && edge.traversableBackward()) {
                if (visitor(first, edge) === false) {
                    //terminate traversal if visitor returns false
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {function(edge:Edge<N>):boolean} visitor
     */
    traverseEdges(visitor) {
        const edges = this.edges;
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            if (visitor(edge) === false) {
                //terminate traversal if visitor returns false
                return;
            }
        }
    }

    /**
     *
     * @param {N} node
     * @param {Graph~visitor} visitor
     */
    traversePredecessors(node, visitor) {
        const edges = this.edges;
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            const first = edge.first;
            const second = edge.second;

            if (second === node && edge.traversableForward()) {
                if (visitor(first, edge) === false) {
                    //terminate traversal if visitor returns false
                    return true;
                }
            } else if (first === node && edge.traversableBackward()) {
                if (visitor(second, edge) === false) {
                    //terminate traversal if visitor returns false
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *
     * @param {N} node
     * @param {Graph~visitor} visitor
     */
    traverseAttachedEdges(node, visitor) {
        const edges = this.edges;
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            const first = edge.first;
            const second = edge.second;

            if (first === node) {
                if (visitor(second, edge) === false) {
                    //terminate traversal if visitor returns false
                    return;
                }
            } else if (second === node) {
                if (visitor(first, edge) === false) {
                    //terminate traversal if visitor returns false
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {N} node1
     * @param {N} node2
     * @returns {Edge<N>|null}
     */
    findConnectingEdge(node1, node2) {
        const edges = this.edges;

        const numEdges = edges.length;

        for (let i = 0; i < numEdges; i++) {

            const edge = edges[i];

            if (edge.contains(node1) && edge.contains(node2)) {
                return edge;
            }

        }

        return null;
    }

    /**
     *
     * @param {N} source
     * @param {N} target
     * @param {function(Edge<N>):boolean} visitor
     */
    findTraversableEdges(source, target, visitor) {
        const edges = this.edges;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            if (edge.validateTransition(source, target)) {

                if (visitor(edge) === false) {
                    return;
                }
            }
        }
    }

    /**
     *
     * @param {N} node
     * @returns {Edge<N>[]}
     */
    getAttachedEdges(node) {
        const result = [];

        this.traverseAttachedEdges(node, function (otherNode, edge) {
            result.push(edge);
        });

        return result;
    }

    /**
     *
     * @param {N} node
     * @returns {boolean}
     */
    containsNode(node) {
        return this.nodes.indexOf(node) > -1;
    }

    /**
     *
     * @returns {number}
     */
    length() {
        const edges = this.edges;
        let result = 0;
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            result += edge.length;
        }
        return result;
    }

    /**
     *
     * @param {N} node
     */
    addNode(node) {
        this.nodes.push(node);
    }

    /**
     * Whether or not the graph contains given node
     * @param {N} node
     * @returns {boolean}
     */
    hasNode(node) {
        return this.nodes.some(n => n === node);
    }

    /**
     *
     * @param {Edge<N>} edge
     */
    addEdge(edge) {
        assert.ok(this.containsNode(edge.first), `Node Edge.first(=${edge.first}) is not present in the graph`);
        assert.ok(this.containsNode(edge.second), `Node Edge.second(=${edge.second}) is not present in the graph`);

        this.edges.push(edge);
        this.onChange.dispatch(edge);
    }

    /**
     *
     * @param {N} source
     * @param {N} target
     * @returns {Edge<N>}
     */
    createEdge(source, target) {
        const edge = new Edge(source, target);

        this.addEdge(edge);

        return edge;
    }

    /**
     *
     * @param {Edge<N>} edge
     */
    removeEdge(edge) {
        const edges = this.edges;
        const indexOf = edges.indexOf(edge);
        if (indexOf >= 0) {
            edges.splice(indexOf, 1);
            this.onChange.dispatch(edge);
        } else {
            console.error("Edge was not found");
        }
    }

    clear() {
        this.edges = [];
        this.nodes = [];
        this.onChange.dispatch();
    }

    /**
     *
     * @returns {Graph<N>}
     */
    clone() {
        const graph = new Graph();
        graph.nodes = this.nodes.slice();
        graph.edges = this.edges.slice();
        return graph;
    }
}


export default Graph;
