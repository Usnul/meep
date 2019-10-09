/*

 Mesh Simplification Unit
 (C) by Sven Forstmann in 2014
 License : MIT (http://opensource.org/licenses/MIT)
 https://github.com/sp4cerat/Fast-Quadric-Mesh-Simplification
 http://www.gamedev.net/topic/656486-high-speed-quadric-mesh-simplification-without-problems-resolved/
 http://voxels.blogspot.com/2014/05/quadric-mesh-simplification-with-source.html
 https://github.com/neurolabusc/Fast-Quadric-Mesh-Simplification-Pascal-

 @author Sven Forstmann, 2014
 @author Joshua Koo, 2016
  - JS Port by Joshua Koo in 2016, https://github.com/zz85 @blurspline
  - https://github.com/neurolabusc/Fast-Quadric-Mesh-Simplification-Pascal-/blob/master/meshify_simplify_quadric.pas
 @author Alex Goldring, 2018
  - Cleanup of code style, more JavaScript-like, and less C-like
  - Broken up a single closure into multiple member methods
  - introduction of JSDoc types
  - optimized many array loops from (i=0;i<arr.length;i++) to (i=0,l=arr.length;i<l;i++) as arrays are live and recomputing length can be avoided in most cases

*/

/**
 *
 * @constructor
 * @class
 */
function SymetricMatrix() {
    /**
     * Matrix elements
     * @type {number[]}
     */
    this.m = new Array(10).fill(0);
}


SymetricMatrix.prototype = {
    /**
     *
     * @param {number} m11
     * @param {number} m12
     * @param {number} m13
     * @param {number} m14
     * @param {number} m22
     * @param {number} m23
     * @param {number} m24
     * @param {number} m33
     * @param {number} m34
     * @param {number} m44
     * @returns {SymetricMatrix}
     */
    set: function set(
        m11, m12, m13, m14,
        m22, m23, m24,
        m33, m34,
        m44) {

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m13;
        this.m[3] = m14;

        this.m[4] = m22;
        this.m[5] = m23;
        this.m[6] = m24;

        this.m[7] = m33;
        this.m[8] = m34;

        this.m[9] = m44;
        return this;
    },

    /**
     *
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {SymetricMatrix}
     */
    makePlane: function makePlane(a, b, c, d) {
        return this.set(
            a * a, a * b, a * c, a * d,
            b * b, b * c, b * d,
            c * c, c * d,
            d * d
        );
    },

    /**
     *
     * @param {int} a11
     * @param {int} a12
     * @param {int} a13
     * @param {int} a21
     * @param {int} a22
     * @param {int} a23
     * @param {int} a31
     * @param {int} a32
     * @param {int} a33
     * @returns {number}
     */
    det: function determinant(
        a11, a12, a13,
        a21, a22, a23,
        a31, a32, a33
    ) {
        const det = this.m[a11] * this.m[a22] * this.m[a33]
            + this.m[a13] * this.m[a21] * this.m[a32]
            + this.m[a12] * this.m[a23] * this.m[a31]
            - this.m[a13] * this.m[a22] * this.m[a31]
            - this.m[a11] * this.m[a23] * this.m[a32]
            - this.m[a12] * this.m[a21] * this.m[a33];
        return det;
    },

    /**
     * produces new Matrix
     * @param {SymetricMatrix} n
     * @returns {SymetricMatrix}
     */
    add: function add(n) {
        return new SymetricMatrix().set(
            this.m[0] + n.m[0],
            this.m[1] + n.m[1],
            this.m[2] + n.m[2],
            this.m[3] + n.m[3],

            this.m[4] + n.m[4],
            this.m[5] + n.m[5],
            this.m[6] + n.m[6],

            this.m[7] + n.m[7],
            this.m[8] + n.m[8],

            this.m[9] + n.m[9]
        );
    },

    /**
     *
     * @param {SymetricMatrix} n
     */
    addSelf: function addSelf(n) {
        this.m[0] += n.m[0];
        this.m[1] += n.m[1];
        this.m[2] += n.m[2];
        this.m[3] += n.m[3];
        this.m[4] += n.m[4];
        this.m[5] += n.m[5];
        this.m[6] += n.m[6];
        this.m[7] += n.m[7];
        this.m[8] += n.m[8];
        this.m[9] += n.m[9]
    }
};

/**
 * Model Objects
 * @constructor
 * @class
 */
function Triangle() {
    /**
     * indices for array
     * @type {int[]}
     */
    this.v = new Array(3);
    /**
     * Errors
     * @type {number[]}
     */
    this.err = new Array(4);
    this.deleted = false;
    this.dirty = false;

    /**
     * Normal
     * @type {Vector3}
     */
    this.n = new Vector3();
}

// function Vector3(x, y, z) {
// 	this.x = x;
// 	this.y = y;
// 	this.z = z;
// };

const Vector3 = THREE.Vector3;

function Vertex() {
    /**
     *
     * @type {Vector3}
     */
    this.p = new Vector3();
    /**
     *
     * @type {int}
     */
    this.tstart = -1;
    /**
     *
     * @type {int}
     */
    this.tcount = -1;
    /**
     *
     * @type {SymetricMatrix}
     */
    this.q = new SymetricMatrix();
    /**
     *
     * @type {boolean}
     */
    this.border = false;
}

function Ref() {
    /**
     *
     * @type {int}
     */
    this.tid = -1;
    /**
     *
     * @type {int}
     */
    this.tvertex = -1;
}

/**
 * Error between vertex and Quadric
 *
 * @param {SymetricMatrix} q
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function vertex_error(q, x, y, z) {
    return q.m[0] * x * x + 2 * q.m[1] * x * y + 2 * q.m[2] * x * z + 2 * q.m[3] * x + q.m[4] * y * y
        + 2 * q.m[5] * y * z + 2 * q.m[6] * y + q.m[7] * z * z + 2 * q.m[8] * z + q.m[9];
}

/**
 *
 * @param {Array} array
 * @param {number} count
 * @returns {Array|undefined} removed elements
 */
function resize(array, count) {
    if (count < array.length) {
        return array.splice(count);
    }

    if (count > array.length) {
        // in JS, arrays need not be expanded
        // console.log('more');
    }
}

function SimplifyModifier() {
    /**
     *
     * @type {Array<Triangle>}
     */
    this.triangles = []; // Triangle
    /**
     *
     * @type {Array<Vertex>}
     */
    this.vertices = []; // Vertex
    /**
     *
     * @type {Array<Ref>}
     */
    this.refs = []; // Ref
}

/**
 *
 * @param {Vector3[]} origVertices
 * @param {Face[]} origFaces
 * @returns {void}
 * @private
 */
SimplifyModifier.prototype.init = function init(origVertices, origFaces) {

    this.vertices = origVertices.map(v => {
        const vert = new Vertex();
        vert.p.copy(v);
        return vert;
    });


    this.triangles = origFaces.map(f => {
        const tri = new Triangle();
        tri.v[0] = f.a;
        tri.v[1] = f.b;
        tri.v[2] = f.c;
        return tri;
    });
};

/**
 * Update triangle connections and edge error after a edge is collapsed
 *
 * @param {int} i0
 * @param {Vertex} v
 * @param {int[]} deleted
 * @param {int} deleted_triangles
 * @returns {number}
 * @private
 */
SimplifyModifier.prototype.update_triangles = function update_triangles(i0, v, deleted, deleted_triangles) {
    // console.log('update_triangles');
    // vec3f p;
    const p = new Vector3();
    for (let k = 0; k < v.tcount; k++) {
        /**
         *
         * @type {Ref}
         */
        const r = this.refs[v.tstart + k];
        /**
         *
         * @type {Triangle}
         */
        const t = this.triangles[r.tid];

        if (t.deleted) {
            continue;
        }

        if (deleted[k]) {
            t.deleted = true;
            deleted_triangles++;
            continue;
        }

        t.v[r.tvertex] = i0;
        t.dirty = true;

        t.err[0] = this.calculate_error(t.v[0], t.v[1], p);
        t.err[1] = this.calculate_error(t.v[1], t.v[2], p);
        t.err[2] = this.calculate_error(t.v[2], t.v[0], p);
        t.err[3] = Math.min(t.err[0], t.err[1], t.err[2]);
        this.refs.push(r);
    }
    return deleted_triangles;
};

/**
 *
 * Main simplification function
 *
 * @param {number} [agressiveness=7] sharpness to increase the threshold.
 * 5..8 are good numbers
 * more iterations yield higher quality
 * @param {number} target_count target nr. of triangles
 * @returns {void}
 * @private
 */
SimplifyModifier.prototype.simplify_mesh = function simplify_mesh(target_count, agressiveness) {
    if (agressiveness === undefined) {
        agressiveness = 7;
    }

    // TODO normalize_mesh to max length 1?

    console.time('simplify_mesh');

    const triangles = this.triangles;
    const vertices = this.vertices;
    const refs = this.refs;

    let i, il;

    // set all triangles to non deleted
    for (i = 0, il = triangles.length; i < il; i++) {
        triangles[i].deleted = false;
    }


    console.timeEnd('simplify_mesh');

    // main iteration loop

    let deleted_triangles = 0;
    const deleted0 = [], deleted1 = []; // std::vector<int>
    const triangle_count = triangles.length;


    for (let iteration = 0; iteration < 100; iteration++) {
        console.log("iteration %d - triangles %d, tris\n",
            iteration, triangle_count - deleted_triangles, triangles.length);

        if (triangle_count - deleted_triangles <= target_count) break;

        // update mesh once in a while
        if (iteration % 5 === 0) {
            this.update_mesh(iteration);
        }

        // clear dirty flag
        for (let j = 0; j < triangles.length; j++) {
            triangles[j].dirty = false;
        }

        /**

         All triangles with edges below the threshold will be removed

         The following numbers works well for most models.
         If it does not, try to adjust the 3 parameters
         @type {number}
         */
        const threshold = 0.000000001 * Math.pow(iteration + 3, agressiveness);

        // remove vertices & mark deleted triangles
        for (i = 0, il = triangles.length; i < il; i++) {
            const t = triangles[i];

            if (t.err[3] > threshold || t.deleted || t.dirty) {
                continue;
            }

            for (j = 0; j < 3; j++) {

                if (t.err[j] < threshold) {

                    const i0 = t.v[j];
                    const v0 = vertices[i0];

                    const i1 = t.v[(j + 1) % 3];
                    const v1 = vertices[i1];

                    // Border check
                    if (v0.border !== v1.border) {
                        continue;
                    }

                    // Compute vertex to collapse to
                    const p = new Vector3();
                    this.calculate_error(i0, i1, p);
                    // console.log('Compute vertex to collapse to', p);

                    resize(deleted0, v0.tcount); // normals temporarily
                    resize(deleted1, v1.tcount); // normals temporarily

                    // dont remove if flipped
                    if (this.flipped(p, i0, i1, v0, v1, deleted0)) continue;
                    if (this.flipped(p, i1, i0, v1, v0, deleted1)) continue;

                    // not flipped, so remove edge
                    // console.log('not flipped, remove edge');
                    // console.log(v0.p, p);
                    v0.p = p;
                    // v0.q = v1.q + v0.q;
                    v0.q.addSelf(v1.q);

                    const tstart = refs.length;

                    // CONTINUE

                    deleted_triangles = this.update_triangles(i0, v0, deleted0, deleted_triangles);
                    // console.log('deleted triangle v0', deleted_triangles);
                    deleted_triangles = this.update_triangles(i0, v1, deleted1, deleted_triangles);
                    // console.log('deleted triangle v1', deleted_triangles);

                    const tcount = refs.length - tstart;

                    if (tcount <= v0.tcount) {
                        // console.log('save ram?');
                        // if(tcount)
                        // 	move(refs, v0.tstart, tstart, tcount);
                    } else {
                        // append
                        v0.tstart = tstart;
                    }

                    v0.tcount = tcount;
                    break;

                }
            } // end for j

            // done?
            if (triangle_count - deleted_triangles <= target_count) {
                break;
            }
        }

    } // end iteration

    function move(refs, dest, source, count) {
        for (let i = 0; i < count; i++) {
            refs[dest + i] = refs[source + i];
        }
    }

    // clean up mesh
    this.compact_mesh();

    // ready
    console.timeEnd('simplify_mesh');

    // int timeEnd=timeGetTime();
    // printf("%s - %d/%d %d%% removed in %d ms\n",__FUNCTION__,
    // 	triangle_count-deleted_triangles,
    // 	triangle_count,deleted_triangles*100/triangle_count,
    // 	timeEnd-timeStart);

};


/**
 * compact triangles, compute edge error and build reference list
 * @param {int} iteration
 * @returns {void}
 * @private
 */
SimplifyModifier.prototype.update_mesh = function update_mesh(iteration) {
    const triangles = this.triangles;
    const vertices = this.vertices;
    const refs = this.refs;

    // console.log('update_mesh', iteration, triangles.length);
    if (iteration > 0) {
        // compact triangles
        let dst = 0;
        for (let i = 0; i < triangles.length; i++) {
            const target = triangles[i];
            if (!target.deleted) {
                triangles[dst++] = target;
            }
        }

        console.log('not deleted dst', triangles.length, dst);
        triangles.splice(dst);

    }
    //
    // Init Quadrics by Plane & Edge Errors
    //
    // required at the beginning ( iteration == 0 )
    // recomputing during the simplification is not required,
    // but mostly improves the result for closed meshes
    //
    if (iteration === 0) {
        for (let i = 0; i < vertices.length; i++) {
            // may not need to do this.
            vertices[i].q = new SymetricMatrix();
        }

        for (let i = 0; i < triangles.length; i++) {
            /**
             *
             * @type {Triangle}
             */
            const t = triangles[i];

            const n = new Vector3();

            const p = new Array(3);

            const p1p0 = new Vector3();
            const p2p0 = new Vector3();

            for (let j = 0; j < 3; j++) {
                p[j] = vertices[t.v[j]].p;
            }

            p1p0.subVectors(p[1], p[0]);
            p2p0.subVectors(p[2], p[0]);


            n.crossVectors(p1p0, p2p0).normalize();

            t.n = n;

            const tmp = new SymetricMatrix().makePlane(
                n.x,
                n.y,
                n.z,
                -n.dot(p[0])
            );

            for (let j = 0; j < 3; j++) {
                vertices[t.v[j]].q.addSelf(tmp);
            }

            // vertices[t.v[j]].q =
            // vertices[t.v[j]].q.add(SymetricMatrix(n.x,n.y,n.z,-n.dot(p[0])));
        }

        for (let i = 0, l = triangles.length; i < l; i++) {

            // Calc Edge Error
            const t = triangles[i];

            const p = new Vector3();

            for (let j = 0; j < 3; j++) {
                t.err[j] = this.calculate_error(t.v[j], t.v[(j + 1) % 3], p);
            }

            t.err[3] = Math.min(t.err[0], t.err[1], t.err[2]);
        }
    }

    // Init Reference ID list
    for (let i = 0, l = vertices.length; i < l; i++) {
        vertices[i].tstart = 0;
        vertices[i].tcount = 0;
    }

    for (let i = 0, l = triangles.length; i < l; i++) {
        /**
         *
         * @type {Triangle}
         */
        const t = triangles[i];

        for (let j = 0; j < 3; j++) {
            const vertexIndex = t.v[j];
            const vertex = vertices[vertexIndex];
            vertex.tcount++;
        }
    }

    let tstart = 0;

    for (let i = 0; i < vertices.length; i++) {
        /**
         *
         * @type {Vertex}
         */
        const v = vertices[i];
        v.tstart = tstart;
        tstart += v.tcount;
        v.tcount = 0;
    }

    // Write References
    // resize(refs, triangles.length * 3)
    console.log('pre ref', refs.length, triangles.length * 3);

    for (let i = refs.length, l = triangles.length * 3; i < l; i++) {
        refs[i] = new Ref();
    }

    for (let i = 0, l = triangles.length; i < l; i++) {
        /**
         *
         * @type {Triangle}
         */
        const t = triangles[i];
        for (let j = 0; j < 3; j++) {
            /**
             *
             * @type {Vertex}
             */
            const v = vertices[t.v[j]];
            const index = v.tstart + v.tcount;

            refs[index].tid = i;
            refs[index].tvertex = j;

            v.tcount++;
        }
    }

    // Identify boundary : vertices[].border=0,1
    if (iteration === 0) {
        /**
         * @type {int[]}
         */
        let vcount, vids;


        for (let i = 0; i < vertices.length; i++) {
            vertices[i].border = 0;
        }

        for (let i = 0; i < vertices.length; i++) {
            /**
             *
             * @type {Vertex}
             */
            const v = vertices[i];
            // vcount.clear();
            // vids.clear();
            vcount = [];
            vids = [];

            for (let j = 0; j < v.tcount; j++) {
                const k = refs[v.tstart + j].tid;
                const /*Triangle &*/ t = triangles[k];

                for (let k = 0; k < 3; k++) {
                    let ofs = 0;
                    const id = t.v[k];
                    while (ofs < vcount.length) {
                        if (vids[ofs] === id) break;
                        ofs++;
                    }

                    if (ofs === vcount.length) {
                        vcount.push(1);
                        vids.push(id);
                    } else {
                        vcount[ofs]++;
                    }
                }
            }

            for (let j = 0; j < vcount.length; j++) {
                if (vcount[j] === 1) {
                    vertices[vids[j]].border = 1;
                }
            }
        }
    }
};

/**
 * Finally compact mesh before exiting
 * @returns {void}
 * @private
 */
SimplifyModifier.prototype.compact_mesh = function compact_mesh() {
    console.log('compact_mesh');
    const vertices = this.vertices;
    const triangles = this.triangles;
    /**
     *
     * @type {int}
     */
    let dst = 0;
    for (let i = 0, l = vertices.length; i < l; i++) {
        vertices[i].tcount = 0;
    }

    for (let i = 0, l = triangles.length; i < l; i++) {
        if (!triangles[i].deleted) {
            /**
             *
             * @type {Triangle}
             */
            const t = triangles[i];
            triangles[dst++] = t;
            for (let j = 0; j < 3; j++)
                vertices[t.v[j]].tcount = 1;
        }
    }

    resize(triangles, dst);

    dst = 0;

    for (let i = 0, l = vertices.length; i < l; i++) {
        if (vertices[i].tcount) {
            vertices[i].tstart = dst;
            vertices[dst].p = vertices[i].p;
            dst++;
        }
    }

    for (let i = 0, l = triangles.length; i < l; i++) {
        /**
         *
         * @type {Triangle}
         */
        const t = triangles[i];
        for (let j = 0; j < 3; j++) {
            t.v[j] = vertices[t.v[j]].tstart;
        }
    }

    console.log('%cCompact Mesh', 'background:#f00', vertices.length, dst);
    resize(vertices, dst);
    console.log('%cCompact Mesh ok', 'background:#f00', vertices.length, dst);
};
/**
 * Error for one edge
 * if DECIMATE is defined vertex positions are NOT interpolated
 * Luebke Survey of Polygonal Simplification Algorithms:  "vertices of a model simplified by the decimation algorithm are a subset of the original model’s vertices."
 * http://www.cs.virginia.edu/~luebke/publications/pdf/cg+a.2001.pdf
 * @param {int} id_v1
 * @param {int} id_v2
 * @param {Vector3} p_result
 * @returns {number}
 * @private
 */
SimplifyModifier.prototype.calculate_error = function calculate_error(id_v1, id_v2, p_result) {
    const vertices = this.vertices;

    // compute interpolated vertex
    const vertex1 = vertices[id_v1];
    const vertex2 = vertices[id_v2];

    const q = vertex1.q.add(vertex2.q);

    const border = vertex1.border && vertex2.border;

    let error = 0;

    const det = q.det(0, 1, 2, 1, 4, 5, 2, 5, 7);

    if (det !== 0 && !border) {
        // q_delta is invertible
        p_result.x = -1 / det * (q.det(1, 2, 3, 4, 5, 6, 5, 7, 8));	// vx = A41/det(q_delta)
        p_result.y = 1 / det * (q.det(0, 2, 3, 1, 5, 6, 2, 7, 8));	// vy = A42/det(q_delta)
        p_result.z = -1 / det * (q.det(0, 1, 3, 1, 4, 6, 2, 5, 8));	// vz = A43/det(q_delta)
        error = vertex_error(q, p_result.x, p_result.y, p_result.z);
    } else {
        // det = 0 -> try to find best result

        /**
         * @type {Vector3}
         */
        const p1 = vertex1.p;
        /**
         * @type {Vector3}
         */
        const p2 = vertex2.p;
        /**
         * @type {Vector3}
         */
        const p3 = new Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        const error1 = vertex_error(q, p1.x, p1.y, p1.z);
        const error2 = vertex_error(q, p2.x, p2.y, p2.z);
        const error3 = vertex_error(q, p3.x, p3.y, p3.z);

        error = Math.min(error1, error2, error3);

        if (error1 === error) p_result.copy(p1);
        if (error2 === error) p_result.copy(p2);
        if (error3 === error) p_result.copy(p3);
    }

    return error;
};

/**
 * @type {Vector3}
 */
const n = new Vector3();
/**
 * @type {Vector3}
 */
const d1 = new Vector3();
/**
 * @type {Vector3}
 */
const d2 = new Vector3();

/**
 * Check if a triangle flips when this edge is removed
 * @param {Vector3} p
 * @param {int} i0
 * @param {int} i1
 * @param {Vertex} v0
 * @param {Vertex} v1
 * @param {int[]} deleted
 * @returns {boolean}
 * @private
 */
SimplifyModifier.prototype.flipped = function flipped(p, i0, i1, v0, v1, deleted) {
    const vertices = this.vertices;
    const triangles = this.triangles;
    const refs = this.refs;

    // const bordercount = 0;
    for (let k = 0; k < v0.tcount; k++) {
        /**
         * @type {Triangle}
         */
        const t = triangles[refs[v0.tstart + k].tid];
        if (t.deleted) {
            continue;
        }

        const s = refs[v0.tstart + k].tvertex;
        const id1 = t.v[(s + 1) % 3];
        const id2 = t.v[(s + 2) % 3];

        if (id1 === i1 || id2 === i1) {
            // delete ?
            // bordercount++;
            deleted[k] = true;
            continue;
        }
        /* vec3f */
        d1.subVectors(vertices[id1].p, p).normalize();
        d2.subVectors(vertices[id2].p, p).normalize();

        if (Math.abs(d1.dot(d2)) > 0.999) {
            return true;
        }

        n.crossVectors(d1, d2).normalize();
        deleted[k] = false;

        if (n.dot(t.n) < 0.2) {
            return true;
        }
    }
    return false;
};

/**
 *
 * @param {THREE.Geometry|THREE.BufferGeometry} geometry
 * @returns {THREE.Geometry}
 */
SimplifyModifier.prototype.modify = function (geometry) {
    if (geometry instanceof THREE.BufferGeometry && !geometry.vertices && !geometry.faces) {
        console.log('converting BufferGeometry to Geometry');
        geometry = new THREE.Geometry().fromBufferGeometry(geometry);
    }

    const vertices = this.vertices;
    const triangles = this.triangles;

    geometry.mergeVertices();


    // convert format
    this.init(geometry.vertices, geometry.faces);

    // simplify!
    // simplify_mesh(geometry.faces.length * 0.5 | 0, 7);
    // simplify_mesh(geometry.faces.length - 2, 4);

    console.time('simplify');
    this.simplify_mesh(150, 7);
    console.timeEnd('simplify');


    console.log('old vertices ' + geometry.vertices.length, 'old faces ' + geometry.faces.length);

    console.log('new vertices ' + vertices.length, 'old faces ' + triangles.length);


    // TODO convert to buffer geometry.
    const newGeo = new THREE.Geometry();

    for (let i = 0, l = vertices.length; i < l; i++) {
        const v = vertices[i];
        newGeo.vertices.push(v.p)
    }

    for (let i = 0, l = triangles.length; i < l; i++) {
        const tri = triangles[i];
        newGeo.faces.push(new THREE.Face3(
            tri.v[0],
            tri.v[1],
            tri.v[2]
        ));
    }

    return newGeo;
};

export { SimplifyModifier }