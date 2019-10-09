import { BinaryNode } from "../BinaryNode";
import { optimize } from "./RotationOptimizer";
import { isLeaf, LeafNode } from "../LeafNode";
import { validateNode, validateTree } from "../NodeValidator";
import { seededRandom } from "../../math/MathUtils";

expect.extend({
    toBeValid(node) {
        const violations = [];

        function violationCallback(v) {
            violations.push(v);
        }

        let pass = true;
        if (isLeaf(node)) {
            pass = pass && validateNode(node, violationCallback);
        } else {
            pass = pass && validateTree(node, violationCallback);
        }

        if (!pass) {
            let message = violations.map((v) => v.toString()).join("\n");

            if (message.trim().length === 0) {
                message = `node is not valid`;
            }

            return {
                message: function () {
                    return message
                },
                pass: false
            };
        }

        return {
            pass: true
        };
    },
    /**
     *
     * @param {BinaryNode} container
     * @param node
     */
    toContainNode(container, node) {
        let found = false;
        let message;
        container.traversePreOrderUsingStack(function (n) {
            if (n === node) {
                found = true;
                //stop traversal
                return false;
            }
        });

        if (!found) {
            message = `node is not contained within the tree`;
        }

        return {
            message,
            pass: found
        };
    }
});

/**
 *
 * @param {number} v0
 * @param {number} v1
 * @param {*} [value]
 * @returns {LeafNode}
 */
function leaf(v0, v1, value) {
    const leafNode = new LeafNode(value, v0, v0, v0, v1, v1, v1);
    return leafNode;
}

/**
 *
 * @param {NodeDescription} left
 * @param {NodeDescription} right
 * @returns {BinaryNode}
 */
function pair(left, right) {
    const node = new BinaryNode();

    if (left === null) {
        node.right = right;
        right.parentNode = node;
        node.refit();
    } else if (right === null) {
        node.left = left;
        left.parentNode = left;
        node.refit();
    } else {
        node.setChildren(left, right);
    }
    return node;
}

test("empty node", () => {
    const node = new BinaryNode();
    node.setInfiniteBounds();

    optimize(node, 100);

    expect(node.left).toBeNull();
    expect(node.right).toBeNull();
});

test("does nothing on optimal 2 child tree", () => {
    const a = leaf(0, 1, "hello");
    const b = leaf(2, 3, "goodbye");

    const root = pair(a, b);

    const optimized = optimize(root, 100);
    expect(optimized).toBe(0);

    //positions preserved
    expect(root.left.object).toEqual(a.object);
    expect(root.right.object).toEqual(b.object);

    //parent node is root
    expect(root.left.parentNode).toEqual(root);
    expect(root.right.parentNode).toEqual(root);

    expect(root).toBeValid();
});

test("does nothing on optimal depth 2 tree", () => {
    const a = leaf(-2, -1, "a");
    const b = leaf(-1, 0, "b");
    const c = leaf(0, 1, "c");
    const d = leaf(1, 2, "d");

    const n0 = pair(a, b);
    const n1 = pair(c, d);

    const root = pair(n0, n1);

    const optimized = optimize(root, 100);
    expect(optimized).toBe(0);

    expect(root.parentNode).toBeNull();

    expect(root.left).toBe(n0);
    expect(root.right).toBe(n1);

    expect(n0.left).toBe(a);
    expect(n0.right).toBe(b);

    expect(n1.left).toBe(c);
    expect(n1.right).toBe(d);

    expect(root).toBeValid();
});

test("produces a valid tree from left-leaning tree with 4 leaves", () => {
    const a = leaf(-2, -1, "a");
    const b = leaf(-1, 0, "b");
    const c = leaf(0, 1, "c");
    const d = leaf(1, 2, "d");

    const root = pair(
        pair(
            pair(c, d),
            b
        ),
        a
    );

    optimize(root, 100);

    expect(root).toBeValid();

    expect(root).toContainNode(a);
    expect(root).toContainNode(b);
    expect(root).toContainNode(c);
    expect(root).toContainNode(d);
});

test("produces a valid tree from right-leaning tree with 4 leaves", () => {
    const a = leaf(-2, -1, "a");
    const b = leaf(-1, 0, "b");
    const c = leaf(0, 1, "c");
    const d = leaf(1, 2, "d");

    const root = pair(
        a,
        pair(
            b,
            pair(c, d)
        )
    );

    optimize(root, 100);

    expect(root).toBeValid();

    expect(root).toContainNode(a);
    expect(root).toContainNode(b);
    expect(root).toContainNode(c);
    expect(root).toContainNode(d);
});

test("100 node random tree optimization does not degrade quality", () => {
    const random = seededRandom(42);

    const nodes = [];

    for (let i = 0; i < 100; i++) {
        const x0 = random() * 100;
        const y0 = random() * 100;
        const z0 = random() * 100;

        const x1 = x0 + random() * 5;
        const y1 = y0 + random() * 5;
        const z1 = z0 + random() * 5;

        nodes.push(new LeafNode(i, x0, y0, z0, x1, y1, z1));
    }

    while (nodes.length >= 2) {
        const left = nodes.pop();
        const right = nodes.pop();
        nodes.unshift(pair(left, right));
    }

    const root = nodes[0];

    const oldSAH = root.computeSAH();

    optimize(root, 100);

    expect(root).toBeValid();

    const newSAH = root.computeSAH();

    //at least not degraded
    expect(newSAH).toBeLessThanOrEqual(oldSAH);
});

test("case 0:  4 node tree optimization does not degrade quality", () => {
    const ll = new LeafNode("ll",
        76.06244471671744,
        7.73902752171125,
        1.925105413576489,
        94.49883157197291,
        50.63123012084361,
        76.75841101302467
    );

    const lr = new LeafNode("lr",
        76.11310176957886,
        58.65097077867176,
        11.346076624795387,
        97.55653706044541,
        89.91247777413719,
        90.73181902923352
    );

    const rl = new LeafNode("rl",
        32.4771196630536,
        0.9366270797727339,
        1.378434756588831,
        66.71670340545461,
        99.32784918828929,
        97.52435446605432
    );

    const rr = new LeafNode("rr",
        1.124263022938976,
        0.13232239543867763,
        2.702786005283997,
        31.51776058888572,
        94.87720282424561,
        101.03932220629758
    );

    const root = pair(pair(ll, lr), pair(rl, rr));

    expect(root).toBeValid();

    const oldSAH = root.computeSAH();

    optimize(root, 1000);

    expect(root).toBeValid();

    const newSAH = root.computeSAH();

    //at least not degraded
    expect(newSAH).toBeLessThanOrEqual(oldSAH);
});
