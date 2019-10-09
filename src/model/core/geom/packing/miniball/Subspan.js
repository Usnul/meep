/**
 * @author Alex Goldring 14/05/2018 - Ported to JS using JSweet + manual editing
 * @author Kaspar Fischer (hbf) 09/05/2013
 * @source https://github.com/hbf/miniball
 * @generated Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org
 */

import { BitSet } from "../../../binary/BitSet";

function Subspan(dim, s, k) {
    /**
     * @type {PointSet}
     */
    this.S = null;

    /**
     *
     * @type {BitSet}
     */
    this.membership = null;

    /**
     *
     * @type {number}
     */
    this.dim = 0;

    /**
     *
     * @type {Int32Array}
     */
    this.members = null;

    this.Q = null;
    this.R = null;

    this.u = null;
    this.w = null;

    this.r = 0;

    this.c = 0;
    this.s = 0;

    this.initialize(dim, s, k);
}

/**
 *
 * @param {int} dim number of dimensions
 * @param {PointSet} s point set
 * @param {int} k index of the point in the point set
 */
Subspan.prototype.initialize = function (dim, s, k) {
    this.S = s;
    this.dim = dim;
    this.membership = new BitSet();
    //reserve bit-field size
    this.membership.setCapacity(s.size());

    this.members = new Int32Array(dim + 1);
    this.r = 0;

    this.Q = new Array(dim);
    this.R = new Array(dim);
    for (let i = 0; i < dim; i++) {
        this.Q[i] = new Array(dim);
        this.R[i] = new Array(dim);
    }

    this.u = new Array(dim);
    this.w = new Array(dim);

    for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
            this.Q[j][i] = (i === j) ? 1.0 : 0.0;
        }
    }

    this.members[this.r] = k;
    this.membership.set(k, true);
};

Subspan.prototype.dimension = function () {
    return this.dim;
};
/**
 * The size of the instance's set <i>M</i>, a number between 0 and {@code dim+1}.
 * <p>
 * Complexity: O(1).
 *
 * @returns {int} <i>|M|</i>
 */
Subspan.prototype.size = function () {
    return this.r + 1;
};


/**
 * Whether <i>S[i]</i> is a member of <i>M</i>.
 * <p>
 * Complexity: O(1)
 *
 * @param {int} i
 *          the "global" index into <i>S</i>
 * @returns {boolean} true iff <i>S[i]</i> is a member of <i>M</i>
 */
Subspan.prototype.isMember = function (i) {
    return this.membership.get(i);
};

/**
 * The global index (into <i>S</i>) of an arbitrary element of <i>M</i>.
 * <p>
 * Precondition: {@code size()>0}
 * <p>
 * Postcondition: {@code isMember(anyMember())}
 * @returns {number}
 */
Subspan.prototype.anyMember = function () {
    return this.members[this.r];
};
/**
 * The index (into <i>S</i>) of the <i>i</i>th point in <i>M</i>. The points in <i>M</i> are
 * internally ordered (in an arbitrary way) and this order only changes when {@link add()} or
 * {@link remove()} is called.
 * <p>
 * Complexity: O(1)
 *
 * @param {number} i
 * the "local" index, 0 ≤ i < {@code size()}
 * @return {number} <i>j</i> such that <i>S[j]</i> equals the <i>i</i>th point of M
 */
Subspan.prototype.globalIndex = function (i) {
    return this.members[i];
};
/**
 * Short-hand for code readability to access element <i>(i,j)</i> of a matrix that is stored in a
 * one-dimensional array.
 *
 * @param {number} i
 * zero-based row number
 * @param {number} j
 * zero-based column number
 * @return {number} the index into the one-dimensional array to get the element at position <i>(i,j)</i> in
 * the matrix
 * @private
 */
Subspan.prototype.ind = function (i, j) {
    return i * this.dim + j;
};
/**
 * The point {@code members[r]} is called the <i>origin</i>.
 *
 * @return {number} index into <i>S</i> of the origin.
 * @private
 */
Subspan.prototype.origin = function () {
    return this.members[this.r];
};
/**
 * Determine the Givens coefficients <i>(c,s)</i> satisfying
 *
 * <pre>
 * c * a + s * b = +/- (a^2 + b^2) c * b - s * a = 0
 * </pre>
 *
 * We don't care about the signs here, for efficiency, so make sure not to rely on them anywhere.
 * <p>
 * <i>Source:</i> "Matrix Computations" (2nd edition) by Gene H. B. Golub & Charles F. B. Van Loan
 * (Johns Hopkins University Press, 1989), p. 216.
 * <p>
 * Note that the code of this class sometimes does not call this method but only mentions it in a
 * comment. The reason for this is performance; Java does not allow an efficient way of returning
 * a pair of doubles, so we sometimes manually "inline" {@code givens()} for the sake of
 * performance.
 * @param {number} a
 * @param {number} b
 * @private
 */
Subspan.prototype.givens = function (a, b) {
    if (b === 0.0) {
        this.c = 1.0;
        this.s = 0.0;
    } else if (Math.abs(b) > Math.abs(a)) {
        let t = a / b;
        this.s = 1 / Math.sqrt(1 + t * t);
        this.c = this.s * t;
    } else {
        let t = b / a;
        this.c = 1 / Math.sqrt(1 + t * t);
        this.s = this.c * t;
    }
};
/**
 * Appends the new column <i>u</i> (which is a member field of this instance) to the right of <i>A
 * = QR</i>, updating <i>Q</i> and <i>R</i>. It assumes <i>r</i> to still be the old value, i.e.,
 * the index of the column used now for insertion; <i>r</i> is not altered by this routine and
 * should be changed by the caller afterwards.
 * <p>
 * Precondition: {@code r<dim}
 * @private
 */
Subspan.prototype.appendColumn = function () {
    for (let i = 0; i < this.dim; ++i) {
        this.R[this.r][i] = 0;
        for (let k = 0; k < this.dim; ++k)
            this.R[this.r][i] += this.Q[i][k] * this.u[k];
    }

    for (let j = this.dim - 1; j > this.r; --j) {
        this.givens(this.R[this.r][j - 1], this.R[this.r][j]);
        this.R[this.r][j - 1] = this.c * this.R[this.r][j - 1] + this.s * this.R[this.r][j];
        for (let i = 0; i < this.dim; ++i) {
            let a = this.Q[j - 1][i];
            let b = this.Q[j][i];
            this.Q[j - 1][i] = this.c * a + this.s * b;
            this.Q[j][i] = this.c * b - this.s * a;
        }

    }

};
/**
 * Adds the point <i>S[index]</i> to the instance's set <i>M</i>.
 * <p>
 * Precondition: {@code !isMember(index)}
 * <p>
 * Complexity: O(dim^2).
 *
 * @param {number} index
 * index into <i>S</i> of the point to add
 */
Subspan.prototype.add = function (index) {
    let o = this.origin();
    for (let i = 0; i < this.dim; ++i)
        this.u[i] = this.S.coord(index, i) - this.S.coord(o, i);
    this.appendColumn();
    this.membership.set(index, true);
    this.members[this.r + 1] = this.members[this.r];
    this.members[this.r] = index;
    ++this.r;
};

/**
 * Computes the vector <i>w</i> directed from point <i>p</i> to <i>v</i>, where <i>v</i> is the
 * point in <i>aff(M)</i> that lies nearest to <i>p</i>.
 * <p>
 * Precondition: {@code size()}>0
 * <p>
 * Complexity: O(dim^2)
 *
 * @param {Array} p
 * Euclidean coordinates of point <i>p</i>
 * @param {Array} w
 * the squared length of <i>w</i>
 * @return
 * @return {number}
 */
Subspan.prototype.shortestVectorToSpan = function (p, w) {
    let o = this.origin();
    for (let i = 0; i < this.dim; ++i)
        w[i] = this.S.coord(o, i) - p[i];
    for (let j = 0; j < this.r; ++j) {
        let scale = 0;
        for (let i = 0; i < this.dim; ++i)
            scale += w[i] * this.Q[j][i];
        for (let i = 0; i < this.dim; ++i)
            w[i] -= scale * this.Q[j][i];
    }
    let sl = 0;
    for (let i = 0; i < this.dim; ++i)
        sl += w[i] * w[i];
    return sl;
};
/**
 * Use this for testing only; the method allocates additional storage and copies point
 * coordinates.
 * @return {number}
 */
Subspan.prototype.representationError = function () {
    let lambdas = (s => {
        let a = [];
        while (s-- > 0)
            a.push(0);
        return a;
    })(this.size());
    let pt = (s => {
        let a = [];
        while (s-- > 0)
            a.push(0);
        return a;
    })(this.dim);
    let max = 0;
    let error;
    for (let j = 0; j < this.size(); ++j) {
        for (let i = 0; i < this.dim; ++i)
            pt[i] = this.S.coord(this.globalIndex(j), i);
        this.findAffineCoefficients(pt, lambdas);
        error = Math.abs(lambdas[j] - 1.0);
        if (error > max)
            max = error;
        for (let i = 0; i < j; ++i) {
            error = Math.abs(lambdas[i] - 0.0);
            if (error > max)
                max = error;
        }

        for (let i = j + 1; i < this.size(); ++i) {
            error = Math.abs(lambdas[i] - 0.0);
            if (error > max)
                max = error;
        }

    }

    return max;
};
/**
 * Calculates the {@code size()}-many coefficients in the representation of <i>p</i> as an affine
 * combination of the points <i>M</i>.
 * <p>
 * The <i>i</i>th computed coefficient {@code lambdas[i]} corresponds to the <i>i</i>th point in
 * <i>M</i>, or, in other words, to the point in <i>S</i> with index {@code globalIndex(i)}.
 * <p>
 * Complexity: O(dim^2)
 * <p>
 * Preconditions: c lies in the affine hull aff(M) and size() > 0.
 * @param {Array} p
 * @param {Array} lambdas
 */
Subspan.prototype.findAffineCoefficients = function (p, lambdas) {
    let o = this.origin();
    for (let i = 0; i < this.dim; ++i)
        this.u[i] = p[i] - this.S.coord(o, i);
    for (let i = 0; i < this.dim; ++i) {
        this.w[i] = 0;
        for (let k = 0; k < this.dim; ++k)
            this.w[i] += this.Q[i][k] * this.u[k];
    }

    let origin_lambda = 1;
    for (let j = this.r - 1; j >= 0; --j) {
        for (let k = j + 1; k < this.r; ++k)
            this.w[j] -= lambdas[k] * this.R[k][j];
        let lj = this.w[j] / this.R[j][j];
        lambdas[j] = lj;
        origin_lambda -= lj;
    }

    lambdas[this.r] = origin_lambda;
};
/**
 * Given <i>R</i> in lower Hessenberg form with subdiagonal entries 0 to {@code pos-1} already all
 * zero, clears the remaining subdiagonal entries via Givens rotations.
 * @param {number} pos
 * @private
 */
Subspan.prototype.hessenberg_clear = function (pos) {
    for (; pos < this.r; ++pos) {
        this.givens(this.R[pos][pos], this.R[pos][pos + 1]);
        this.R[pos][pos] = this.c * this.R[pos][pos] + this.s * this.R[pos][pos + 1];
        for (let j = pos + 1; j < this.r; ++j) {
            let a = this.R[j][pos];
            let b = this.R[j][pos + 1];
            this.R[j][pos] = this.c * a + this.s * b;
            this.R[j][pos + 1] = this.c * b - this.s * a;
        }

        for (let i = 0; i < this.dim; ++i) {
            let a = this.Q[pos][i];
            let b = this.Q[pos + 1][i];
            this.Q[pos][i] = this.c * a + this.s * b;
            this.Q[pos + 1][i] = this.c * b - this.s * a;
        }

    }

};
/**
 * Update current QR-decomposition <i>A = QR</i> to
 *
 * <pre>
 * A + u * [1,...,1] = Q' R'.
 * </pre>
 * @private
 */
Subspan.prototype.special_rank_1_update = function () {
    for (let i = 0; i < this.dim; ++i) {
        this.w[i] = 0;
        for (let k = 0; k < this.dim; ++k)
            this.w[i] += this.Q[i][k] * this.u[k];
    }

    for (let k = this.dim - 1; k > 0; --k) {
        this.givens(this.w[k - 1], this.w[k]);
        this.w[k - 1] = this.c * this.w[k - 1] + this.s * this.w[k];
        this.R[k - 1][k] = -this.s * this.R[k - 1][k - 1];
        this.R[k - 1][k - 1] *= this.c;
        for (let j = k; j < this.r; ++j) {
            let a = this.R[j][k - 1];
            let b = this.R[j][k];
            this.R[j][k - 1] = this.c * a + this.s * b;
            this.R[j][k] = this.c * b - this.s * a;
        }

        for (let i = 0; i < this.dim; ++i) {
            let a = this.Q[k - 1][i];
            let b = this.Q[k][i];
            this.Q[k - 1][i] = this.c * a + this.s * b;
            this.Q[k][i] = this.c * b - this.s * a;
        }

    }

    for (let j = 0; j < this.r; ++j)
        this.R[j][0] += this.w[0];
    this.hessenberg_clear(0);
};

Subspan.prototype.remove = function (index) {
    this.membership.clear(this.globalIndex(index));
    if (index === this.r) {
        let o = this.origin();
        let gi = this.globalIndex(this.r - 1);
        for (let i = 0; i < this.dim; ++i)
            this.u[i] = this.S.coord(o, i) - this.S.coord(gi, i);
        --this.r;
        this.special_rank_1_update();
    } else {
        let dummy = this.R[index];
        for (let j = index + 1; j < this.r; ++j) {
            this.R[j - 1] = this.R[j];
            this.members[j - 1] = this.members[j];
        }

        this.members[this.r - 1] = this.members[this.r];
        this.R[--this.r] = dummy;
        this.hessenberg_clear(index);
    }
};

export { Subspan };