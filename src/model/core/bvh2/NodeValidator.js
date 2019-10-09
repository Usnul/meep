import { BinaryNode } from "./BinaryNode";
import { isLeaf } from "./LeafNode";
import { buildShortStringPath } from "./Node";

/**
 *
 * @param {NodeDescription} node
 * @param {ViolationType} type
 * @param {String} message
 * @constructor
 */
function Violation(node, type, message) {
    this.node = node;
    this.type = type;
    this.message = message;
}


Violation.prototype.toString = function () {
    return `Path: ${buildShortStringPath(this.node, 5)}, Type: ${this.type}, Message: ${this.message}`;
};

/**
 *
 * @enum {string}
 */
const ViolationType = {
    IllegalChildValue: "illegal child value",
    IllegalParentValue: "illegal parent value",
    Containment: "containment",
    Bounds: "bounds"
};


/**
 *
 * @param {BinaryNode} node
 * @param {function(Violation)} violationCallback
 * @returns {boolean}
 */
function validateTree(node, violationCallback) {
    const visited = new Set();
    let violatingNodes = 0;
    node.traversePreOrder(function (n) {
        if (visited.has(n)) {
            violatingNodes++;
            addReason(node, ViolationType.Containment, `node is found in multiple locations in the tree`, violationCallback);
        } else {
            visited.add(n);
        }

        let isValid = validateNode(n, violationCallback);

        if (!isValid) {
            violatingNodes++;
        }
    });
    return violatingNodes === 0;
}

function addReason(node, type, message, reasonCallback) {
    if (typeof reasonCallback === "function") {
        const violation = new Violation(node, type, message);
        reasonCallback(violation);
    }
}

/**
 *
 * @param {NodeDescription} node
 * @param {function(Violation)} violationCallback
 * @returns {boolean}
 */
function validateNode(node, violationCallback) {
    let result = true;

    /**
     *
     * @param {*} value
     * @param {string} name
     * @returns {boolean}
     */
    function validateCoordinate(value, name) {
        let result = true;
        if (typeof value !== "number") {
            addReason(node, ViolationType.Bounds, `${name} must be a number, but instead was ${typeof value}`, violationCallback);
            result = false;
        } else if (Number.isNaN(value)) {
            addReason(node, ViolationType.Bounds, `${name} is NaN`, violationCallback);
            result = false;
        }
        return result;
    }

    function validateAxis(name) {
        const v0Name = name + "0";
        const v1Name = name + "1";

        const v0 = node[v0Name];
        const v1 = node[v1Name];

        const valid0 = validateCoordinate(v0, v0Name);
        const valid1 = validateCoordinate(v1, v1Name);

        if (!valid0 || !valid1) {
            result = false;
        } else if (v0 > v1) {
            addReason(node, ViolationType.Bounds, `${v0Name}(=${v0}) > ${v1Name}(=${v1}), negative size`, violationCallback);
            result = false;
        }
    }

    //check bounds
    validateAxis("x");
    validateAxis("y");
    validateAxis("z");

    if (!isLeaf(node)) {
        const binaryNodeConstraintsValid = validateBinaryNode(node, violationCallback);
        if (!binaryNodeConstraintsValid) {
            result = false;
        }
    }

    return result;
}

/**
 *
 * @param {BinaryNode} node
 * @param {function(Violation)} [reasonCallback]
 * @returns {boolean}
 */
function validateBinaryNode(node, reasonCallback) {

    function validateChild(child, name) {
        if (child === null) {
            return true;
        }

        if (child === undefined) {
            addReason(node, ViolationType.IllegalChildValue, name + " child is 'undefined', this is an illegal value.", reasonCallback);
            return false;
        }

        if (child.parentNode !== node) {
            addReason(node, ViolationType.IllegalParentValue, name + " child is parented to different node than this one.", reasonCallback);
            return false;
        }

        if (!node.containsBox(child)) {
            addReason(node, ViolationType.Containment, name + " child violates parent's bounds", reasonCallback);
            return false;
        }

        return true;
    }

    let result = true;

    result = result && validateChild(node.left, "left");
    result = result && validateChild(node.right, "right");

    //left and right node must be different nodes
    if (node.left !== null && node.left === node.right) {
        addReason(node, ViolationType.IllegalChildValue, "left and right child are the same non-null node");
        result = false;
    }

    return result;
}

function validateContainment(node, violation) {
    if (node.left !== null) {
        if (!node.containsBox(node.left)) {
            violation(node.left)
        } else if (node.left instanceof BinaryNode) {
            validateContainment(node.left, violation);
        }

    }
    if (node.right !== null) {
        if (!node.containsBox(node.right)) {
            violation(node.right)
        } else if (node.right instanceof BinaryNode) {
            validateContainment(node.right, violation);
        }
    }
}

export {
    ViolationType,
    validateNode,
    validateTree
};
