/**
 * @author Alex Goldring 14/05/2018 - Ported to JS using JSweet + manual editing
 * @author Kaspar Fischer (hbf) 09/05/2013
 * @source https://github.com/hbf/miniball
 * @generated Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org
 */


import { Subspan } from "./Subspan";
import { Quality } from "./Quality";

/**
 * Computes the miniball of the given point set.
 *
 * Notice that the point set {@code pts} is assumed to be immutable during the computation. That
 * is, if you add, remove, or change points in the point set, you have to create a new instance of
 * {@link Miniball}.
 *
 * @param {PointSet} pts
 * the point set
 * @class
 */
class Miniball {
    /**
     *
     * @param {PointSet} pts
     */
    constructor(pts) {
        this.iteration = 0;
        this.distToAff = 0;
        this.distToAffSquare = 0;
        this.__squaredRadius = 0;
        this.__radius = 0;
        this.stopper = 0;

        /**
         * @type {PointSet}
         */
        this.S = pts;

        this.__size = this.S.size();

        this.dim = this.S.dimension();

        this.__center = (s => {
            let a = [];
            while (s-- > 0)
                a.push(0);
            return a;
        })(this.dim);

        this.centerToAff = (s => {
            let a = [];
            while (s-- > 0)
                a.push(0);
            return a;
        })(this.dim);

        this.centerToPoint = (s => {
            let a = [];
            while (s-- > 0)
                a.push(0);
            return a;
        })(this.dim);

        this.lambdas = (s => {
            let a = [];
            while (s-- > 0)
                a.push(0);
            return a;
        })(this.dim + 1);

        this.__support = this.initBall();
        this.compute();
    }

    /**
     * Whether or not the miniball is the empty set, equivalently, whether {@code points.size() == 0}
     * was true when this miniball instance was constructed.
     *
     * Notice that the miniball of a point set <i>S</i> is empty if and only if <i>S={}</i>.
     *
     * @return {boolean} true iff
     */
    isEmpty() {
        return this.__size === 0;
    }

    /**
     * The radius of the miniball.
     * <p>
     * Precondition: {@code !isEmpty()}
     *
     * @return {number} the radius of the miniball, a number ≥ 0
     */
    radius() {
        return this.__radius;
    }

    /**
     * The squared radius of the miniball.
     * <p>
     * This is equivalent to {@code radius() * radius()}.
     * <p>
     * Precondition: {@code !isEmpty()}
     *
     * @return {number} the squared radius of the miniball
     */
    squaredRadius() {
        return this.__squaredRadius;
    }

    /**
     * The Euclidean coordinates of the center of the miniball.
     * <p>
     * Precondition: {@code !isEmpty()}
     *
     * @return {Array} an array holding the coordinates of the center of the miniball
     */
    center() {
        return this.__center;
    }

    /**
     * The number of input points.
     *
     * @return {number} the number of points in the original point set, i.e., {@code pts.size()} where
     * {@code pts} was the {@link PointSet} instance passed to the constructor of this
     * instance
     */
    size() {
        return this.__size;
    }

    /**
     * TODO
     *
     * @return
     * @return {*}
     */
    support() {
        throw new Error("Not implemented yet.");
    }

    /*private*/
    static sqr(x) {
        return x * x;
    }

    /**
     * Sets up the search ball with an arbitrary point of <i>S</i> as center and with exactly one of
     * the points farthest from center in the support. So the current ball contains all points of
     * <i>S</i> and has radius at most twice as large as the minball.
     * <p>
     * Precondition: {@code size > 0}
     * @return {Subspan}
     * @private
     */
    initBall() {
        let i, j;

        const dim = this.dim;

        const center = this.__center;

        const pointSet = this.S;

        for (i = 0; i < dim; ++i) {
            center[i] = pointSet.coord(0, i);
        }

        this.__squaredRadius = 0;

        let farthest = 0;

        const numPoints = pointSet.size();

        for (j = 1; j < numPoints; ++j) {
            let dist = 0;

            for (i = 0; i < dim; ++i) {
                dist += Miniball.sqr(pointSet.coord(j, i) - center[i]);
            }

            if (dist >= this.__squaredRadius) {
                this.__squaredRadius = dist;
                farthest = j;
            }
        }

        this.__radius = Math.sqrt(this.__squaredRadius);
        return new Subspan(this.dim, pointSet, farthest);
    }

    /*private*/
    computeDistToAff() {
        this.distToAffSquare = this.__support.shortestVectorToSpan(this.__center, this.centerToAff);
        this.distToAff = Math.sqrt(this.distToAffSquare);
    }

    /*private*/
    updateRadius() {
        let any = this.__support.anyMember();
        this.__squaredRadius = 0;
        for (let i = 0; i < this.dim; ++i)
            this.__squaredRadius += Miniball.sqr(this.S.coord(any, i) - this.__center[i]);
        this.__radius = Math.sqrt(this.__squaredRadius);
        //if (com.dreizak.miniball.highdim.Logging.log)
        //    com.dreizak.miniball.highdim.Logging.debug("current radius = " + this.__radius);
    }

    /**
     * The main function containing the main loop.
     * <p>
     * Iteratively, we compute the point in support that is closest to the current center and then
     * walk towards this target as far as we can, i.e., we move until some new point touches the
     * boundary of the ball and must thus be inserted into support. In each of these two alternating
     * phases, we always have to check whether some point must be dropped from support, which is the
     * case when the center lies in <i>aff(support)</i>. If such an attempt to drop fails, we are
     * done; because then the center lies even <i>conv(support)</i>.
     * @private
     */

    /*private*/
    compute() {
        while ((true)) {
            ++this.iteration;
            //if (com.dreizak.miniball.highdim.Logging.log) {
            //    com.dreizak.miniball.highdim.Logging.debug("Iteration " + this.iteration);
            //    com.dreizak.miniball.highdim.Logging.debug(this.__support.size() + " points on the boundary");
            //}
            this.computeDistToAff();
            while ((this.distToAff <= Miniball.Eps * this.__radius || this.__support.size() === this.dim + 1)) {
                if (!this.successfulDrop()) {
                    //if (com.dreizak.miniball.highdim.Logging.log)
                    //    com.dreizak.miniball.highdim.Logging.info("Done");
                    return;
                }
                this.computeDistToAff();
            }

            let scale = this.findStopFraction();
            if (this.stopper >= 0) {

                for (let i = 0; i < this.dim; ++i) {
                    this.__center[i] += scale * this.centerToAff[i];
                }

                this.updateRadius();
                this.__support.add(this.stopper);
            } else {

                for (let i = 0; i < this.dim; ++i) {
                    this.__center[i] += this.centerToAff[i];
                }

                this.updateRadius();
                if (!this.successfulDrop()) {
                    return;
                }
            }
        }

    }

    /**
     * If center doesn't already lie in <i>conv(support)</i> and is thus not optimal yet,
     * {@link #successfulDrop()} elects a suitable point <i>k</i> to be removed from the support and
     * returns true. If the center lies in the convex hull, however, false is returned (and the
     * support remains unaltered).
     * <p>
     * Precondition: center lies in <i>aff(support)</i>.
     * @return {boolean}
     */
    successfulDrop() {
        this.__support.findAffineCoefficients(this.__center, this.lambdas);
        let smallest = 0;
        let minimum = 1;
        for (let i = 0; i < this.__support.size(); ++i)
            if (this.lambdas[i] < minimum) {
                minimum = this.lambdas[i];
                smallest = i;
            }

        if (minimum <= 0) {
            this.__support.remove(smallest);
            return true;
        }
        return false;
    }

    /**
     * Given the center of the current enclosing ball and the walking direction {@code centerToAff},
     * determine how much we can walk into this direction without losing a point from <i>S</i>. The
     * (positive) factor by which we can walk along {@code centerToAff} is returned. Further,
     * {@code stopper} is set to the index of the most restricting point and to -1 if no such point
     * was found.
     * @return {number}
     * @private
     */

    /*private*/
    findStopFraction() {
        let scale = 1;

        this.stopper = -1;

        let i, j;

        const dim = this.dim;

        const center = this.__center;
        const pointSet = this.S;

        for (j = 0; j < this.__size; ++j)

            if (!this.__support.isMember(j)) {

                for (i = 0; i < dim; ++i) {
                    this.centerToPoint[i] = pointSet.coord(j, i) - center[i];
                }

                let dirPointProd = 0;

                for (i = 0; i < dim; ++i) {
                    dirPointProd += this.centerToAff[i] * this.centerToPoint[i];
                }

                if (this.distToAffSquare - dirPointProd < Miniball.Eps * this.__radius * this.distToAff) {
                    continue;
                }

                let bound = 0;

                for (i = 0; i < dim; ++i) {
                    bound += this.centerToPoint[i] * this.centerToPoint[i];
                }

                bound = (this.__squaredRadius - bound) / 2 / (this.distToAffSquare - dirPointProd);

                if (bound > 0 && bound < scale) {
                    //if (com.dreizak.miniball.highdim.Logging.log)
                    //   com.dreizak.miniball.highdim.Logging.debug("found stopper " + j + " bound=" + bound + " scale=" + scale);
                    scale = bound;
                    this.stopper = j;
                }

            }

        return scale;
    }

    /**
     * Verifies that the computed ball is indeed the miniball.
     * <p>
     * This method should be called for testing purposes only; it may not be very efficient.
     * @return {Quality}
     */
    verify() {
        let min_lambda = 1;
        let max_overlength = 0;
        let min_underlength = 0;
        let ball_error;
        let qr_error = this.__support.representationError();
        this.__support.findAffineCoefficients(this.__center, this.lambdas);
        for (let k = 0; k < this.__support.size(); ++k)
            if (this.lambdas[k] <= min_lambda)
                min_lambda = this.lambdas[k];

        for (let k = 0; k < this.S.size(); ++k) {
            for (let i = 0; i < this.dim; ++i)
                this.centerToPoint[i] = this.S.coord(k, i) - this.__center[i];
            let sqDist = 0;
            for (let i = 0; i < this.dim; ++i)
                sqDist += Miniball.sqr(this.centerToPoint[i]);
            ball_error = Math.sqrt(sqDist) - this.__radius;
            if (ball_error > max_overlength)
                max_overlength = ball_error;
            if (this.__support.isMember(k))
                if (ball_error < min_underlength)
                    min_underlength = ball_error;
        }

        return new Quality(qr_error, min_lambda, max_overlength / this.__radius, Math.abs(min_underlength / this.__radius), this.iteration, this.__support.size());
    }

    /**
     * Outputs information about the miniball; this includes the quality information provided by
     * {@link #verify()} (and as a consequence, {@link #toString()} is expensive to call).
     * @return {string}
     */
    toString() {
        let s = "Miniball [";
        if (this.isEmpty()) {
            s += ("isEmpty=true");
        } else {
            s += ("center=(");
            for (let i = 0; i < this.dim; ++i) {
                s += (this.__center[i]);
                if (i < this.dim - 1)
                    s += (", ");
            }

            s += `), radius=${this.__radius}, squaredRadius=${this.__squaredRadius}, quality=${this.verify()}`;
        }
        s += "]";
        return s;
    }
}

Miniball.Eps = 1.0E-14;


export { Miniball };