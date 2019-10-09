/**
 * Created by Alex on 30/06/2015.
 */
/**
 * Created by Alex Goldring on 25/06/2015.
 */
let Pair = function (a, b) {
    this.a = a;
    this.b = b;
    this.contains = function (x) {
        return this.a === x || this.b === x;
    }
};
let Triple = function (a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.contains = function (x) {
        return this.a === x || this.b === x || this.c === x;
    }
};
const SortedArray = function (store, compareFunction) {
    if (compareFunction === void 0) {
        compareFunction = function (a, b) {
            return a - b;
        }
    }

    function binaryLowIndex(array, el) {
        let minIndex = 0;
        let maxIndex = array.length - 1;
        let currentIndex;
        while (minIndex <= maxIndex) {
            currentIndex = (minIndex + maxIndex) >> 1;
            const cmp = compareFunction(el, array[currentIndex]);
            if (cmp > 0) {
                minIndex = currentIndex + 1;
            } else if (cmp < 0) {
                maxIndex = currentIndex - 1;
            } else {
                //set low boundary for next step based on assumption that upper bound is higher than lower bound
                break;
            }
        }
        return currentIndex;
    }

    this.insert = function (el) {
        const lowIndex = binaryLowIndex(store, el);
        store.splice(lowIndex, 0, el);
    };

    this.indexOf = function (el) {
        let low = 0;
        let high = store.length - 1;
        while (low <= high) {
            const mid = (high + low) >> 1;
            const cmp = compareFunction(el, store[mid]);
            if (cmp > 0) {
                low = mid + 1;
            } else if (cmp < 0) {
                high = mid - 1;
            } else {
                return mid;
            }
        }
        return -1;
    };

    this.contains = function (el) {
        return this.indexOf(el) !== -1;
    };

    this.size = function () {
        return store.length;
    };

    this.get = function (index) {
        return store[index];
    };

    this.getStore = function () {
        return store;
    }
};

const Edge = function (a, b) {
    //at most 2 faces can share an edge
    this.f0 = void 0;
    this.f1 = void 0;
    //edge must have 2 vertices
    this.a = a;
    this.b = b;
    this.containsFace = function (x) {
        return this.f0 === x || this.f1 === x;
    };
    this.getOtherNode = function (x) {
        return x == this.a ? this.b : this.x;
    }
};

const Graph = function () {
    this.nodes = [];
    this.edges = [];
    this.faces = [];
    this.attachedEdges = [];
};

Graph.prototype.getEdge = function (v0, v1) {
    const ae = this.attachedEdges;
    const v0e = ae[v0];
    let i, l, e;
    if (v0e !== void 0) {
        for (i = 0, l = v0e.length; i < l; i++) {
            e = v0e[i];
            if (v0e.contains(v1)) {
                return e;
            }
        }
    }
    const v1e = ae[v1];
    if (v1e !== void 0) {
        for (i = 0, l = v1e.length; i < l; i++) {
            e = v1e[i];
            if (v1e.contains(v0)) {
                return e;
            }
        }
    }
    //not found
    return void 0;
};
Graph.prototype.makeEdge = function (v0, v1) {
    const edge = new Edge(v0, v1);
    this.edges.push(edge);
    const ae = this.attachedEdges;
    if (ae[v0] === void 0) {
        ae[v0] = [edge];
    } else {
        ae[v0].push(edge);
    }

    if (ae[v1] === void 0) {
        ae[v1] = [edge];
    } else {
        ae[v1].push(edge);
    }
    return edge;
};
Graph.prototype.addEdge = function (face, v0, v1) {
    //check for such edge
    let edge = this.getEdge(v0, v1);
    if (edge !== void 0) {
        if (edge.f1 === void 0) {
            edge.f1 = face;
        } else if (edge.f0 === void 0) {
            edge.f0 = face;
        } else {
            throw new Error("both face slots are taken");
        }
    } else {
        //good news, edge doesn't exist
        edge = this.makeEdge(v0, v1);
        edge.f0 = face;
    }
};

Graph.prototype.addEdgesForFace = function (f) {
    this.addEdge(f, f.a, f.b);
    this.addEdge(f, f.b, f.c);
    this.addEdge(f, f.c, f.a);
};

Graph.prototype.buildEdgesFromFaces = function () {
    const faces = this.faces;
    let i = 0;
    const l = faces.length;
    for (; i < l; i++) {
        this.addEdgesForFace(faces[i]);
    }
};

function dot(v0, v1) {
    return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
}

Graph.prototype.angleAtPoint = function (x) {
    //get all attached edges
    const attachedEdges = this.attachedEdges[x];
    if (attachedEdges === void 0) {
        //no edges attached
        return 0;
    }
    const numAttachedEdges = attachedEdges.length;

    let edge;
    if (numAttachedEdges === 0) {
        //no edges attached
        return 0;
    } else if (numAttachedEdges === 1) {
        //one edge attached only, it forms no visible topology
        return 0;
    }

    //normal of the point will be combination of face normals
    const attachedFaces = this.getFacesAttachedToNode(x);
    const numAttachedFaces = attachedFaces.left;

    let absAngleSum = 0;
    let f0 = attachedFaces[0], f1;
    for (i = 1; i < numAttachedFaces; i++) {
        f1 = attachedFaces[i];
        const dotValue = dot(f0.normal, f1.normal);
        const angle = math.acos(dotValue);
        absAngleSum += Math.abs(angle);
        //roll
        f0 = f1;
    }
    return absAngleSum;
};
/**
 * Simple point is one that's at a center of a fan, it's not at the edge of topology and when removes would form a hole enclosed by a manifold
 * @param x
 * @returns {boolean}
 */
Graph.prototype.isSimplePoint = function (x) {
    const ae = this.attachedEdges[x];
    if (ae === void 0) {
        return false;
    }
    const openSet = [];
    let i = 0;
    const l = ae.length;
    for (; i < l; i++) {
        const edge = ae[i];

        if (edge.f1 === void 0) {
            //edge only has one face attached to it, this breaks the fan
            return false;
        }

        let fi = openSet.indexOf(edge.f0);
        if (fi !== -1) {
            openSet.splice(fi, 1);
        } else {
            openSet.push(edge.f0);
        }

        fi = openSet.indexOf(edge.f1);
        if (fi !== -1) {
            openSet.splice(fi, 1);
        } else {
            openSet.push(edge.f1);
        }
    }
    //open set contains unmatched faces. Every edge should connect two attached faces, so any unmatched faces denote breaks in the fan
    return openSet.length === 0;
};
Graph.prototype.getFacesAttachedToNode = function (x) {
    const result = [];

    const edges = this.attachedEdges[x];
    if (edges !== void 0) {
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const edge = edges[i];
            if (edge.f0 !== undefined && result.indexOf(edge.f0) === -1) {
                result.push(edge.f0);
            }
            if (edge.f1 !== undefined && result.indexOf(edge.f1) === -1) {
                result.push(edge.f1);
            }
        }
    }

    return result;
};

function binaryIndexOf(array, el) {
    let low = 0;
    let high = array.length - 1;
    while (low <= high) {
        const mid = (high + low) >> 1;
        const cmp = el - array[mid];
        if (cmp > 0) {
            low = mid + 1;
        } else if (cmp < 0) {
            high = mid - 1;
        } else {
            return mid;
        }
    }
    return -1;
}

function binaryLowIndex(array, el) {
    let minIndex = 0;
    let maxIndex = array.length - 1;
    let currentIndex;
    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) >> 1;
        const cmp = el - array[mid];
        if (cmp > 0) {
            minIndex = currentIndex + 1;
        } else if (cmp < 0) {
            maxIndex = currentIndex - 1;
        } else {
            //set low boundary for next step based on assumption that upper bound is higher than lower bound
            break;
        }
    }
    return currentIndex;
}

Graph.prototype.computeRedundantPoints = function () {
    const nodes = this.nodes;
    const marks = [];
    let i, l;
    for (i = 0, l = nodes.length; i < l; i++) {
        let isSimple = this.isSimplePoint(i);
        if (!isSimple) {
            continue;
        }
        const a = this.angleAtPoint(i);
        if (a === 0) {
            //nuke this point
            marks.push(i);
        }
    }
    return marks;
};

Graph.prototype.computeFlatParts = function () {

    const marks = this.computeRedundantPoints();
    let i, l;
    const ae = this.attachedEdges;

    function processCandidate(p, group) {
        const attached = ae[p];
        if (attached === void 0) {
            return;
        }
        let j = 0;
        const jl = attached.length;
        for (; j < jl; j++) {
            const e = attached[j];
            const otherNode = e.getOtherNode(p);
            const index = binaryIndexOf(marks, otherNode);
            if (index !== -1) {
                const mark = marks[index];
                marks.splice(index, 1);

                group.insert(mark);

                processCandidate(mark, group);
            }
        }
    }

    const groups = [];
    //group marked nodes if they are connected by an edge
    while (marks.length > 0) {
        const candidate = marks.pop();
        const group = new SortedArray([candidate]);
        groups.push(group);
        //look for friends
        processCandidate(candidate, group);
    }

    function isNeighbour(source, target, edges) {
        let i = 0;
        const l = edges.length;
        for (; i < l; i++) {
            const e = edges[i];
            const otherNode = e.getOtherNode(source);
            if (otherNode === target) {
                return true;
            }
        }
    }

    //we have groups of vertices that denote flat areas
    function computeGroupOutline(group) {
        const open = [];
        let i, j, l, attachedEdges;
        for (i = 0, l = group.size(); i < l; i++) {
            const p = group.get(i);
            //find neighbours of p that are not in group
            attachedEdges = ae[p];
            for (j = 0, jl = attachedEdges.length; j < jl; j++) {
                const edge = attachedEdges[j];
                const otherNode = edge.getOtherNode(p);
                if (!group.contains(otherNode)) {
                    open.push(otherNode);
                }
            }
        }

        //now order open set so that points align by edges that connect them
        let prev = open[0];
        for (i = 1, l = open.length; i < l; i++) {
            let current = open[i];
            attachedEdges = ae[prev];
            //check if current is in correct order
            if (!isNeighbour(prev, current, attachedEdges)) {
                //wrong order
                let swapFlag = false;
                for (j = i + 1; j < l; j++) {
                    const possibleMatch = open[j];
                    if (isNeighbour(prev, possibleMatch, attachedEdges)) {
                        //match found, do swap
                        open[i] = possibleMatch;
                        open[j] = current;
                        current = possibleMatch;
                        swapFlag = true;
                        break;
                    }
                }
                if (!swapFlag && (i + 1) < l) {
                    throw new Error("Failed to find next element");
                }
            }
            //roll
            prev = current;
        }
        //order should be fine now
        return open;
    }

    function computeGroupFaces(group) {
        const result = [];
        group.forEach(function (v) {
            const edges = ae[v];
            edges.forEach(function (edge) {
                if (result.indexOf(edge.f0) === -1) {
                    result.push(edge.f0);
                }
                if (result.indexOf(edge.f1) === -1) {
                    result.push(edge.f1);
                }
            });
        });
        return result;
    }

    const result = groups.map(function (sa) {
        const group = sa.getStore();
        return {
            vertices: group,
            faces: computeGroupFaces(group),
            outline: computeGroupOutline(sa)
        };
    });

    return result;
};
Graph.prototype.removeVertices = function (verticesToRemove) {
    const vertices = this.nodes;
    let offsetValue = verticesToRemove.length;
    //sort vertices for faster lookup
    verticesToRemove.sort(function (v0, v1) {
        return v0 - v1;
    });
    //removing vertices is harder as references to vertices in faces are by index, so indices will need to be patched also
    for (let i = vertices.length - 1; i >= 0; i--) {
        //figure out if we're removing this one or not
        const removalIndex = binaryIndexOf(verticesToRemove, i);
        if (removalIndex !== -1) {
            //yes, this vertex is being removed
            verticesToRemove.splice(removalIndex, 1);
            offsetValue--;
            vertices.splice(i, 1);
        } else {
            //no this vertex stays, all face references need to be patched
            const newRef = i - offsetValue;
            const facesToFix = this.getFacesAttachedToNode(i);
            let j = 0;
            const jl = facesToFix.length;
            for (; j < jl; j++) {
                //patch references in this face

                const face = facesToFix[j];

                if (face.a === i) {
                    face.a = newRef;
                } else if (face.b === i) {
                    face.b = newRef;
                } else if (face.c === i) {
                    face.c = newRef;
                }
            }
        }
    }
};

Graph.prototype.fillOutline = function (pointList) {
    //1) make a shape
    //2) tessellate
};

Graph.prototype.removeFaces = function (facesToRemove) {
    const faces = this.faces;

    let i = 0;
    const l = facesToRemove.length;
    for (; i < l; i++) {
        const faceToRemove = facesToRemove[i];
        const j = faces.indexOf(faceToRemove);
        faces.splice(j, 1);
    }

};
Graph.prototype.simplifyPart = function (part) {
    const verticesToRemove = part.vertices;
    const facesToRemove = part.faces;

    this.removeFaces(facesToRemove);
    this.removeVertices(verticesToRemove);
    this.fillOutline(part.outline);
};
Graph.prototype.simplify = function () {
    this.buildEdgesFromFaces();
    const flatParts = this.computeFlatParts();
    let i = 0;
    const l = flatParts.length;
    for (; i < l; i++) {
        const part = flatParts[i];
        this.simplifyPart(part);
    }
};

export default Graph;