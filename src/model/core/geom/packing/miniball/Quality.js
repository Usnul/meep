/**
 * @author Alex Goldring 14/05/2018 - Ported to JS using JSweet + manual editing
 * @author Kaspar Fischer (hbf) 09/05/2013
 * @source https://github.com/hbf/miniball
 * @generated Generated from Java with JSweet 2.2.0-SNAPSHOT - http://www.jsweet.org
 */

/**
 * Information about the quality of the computed ball.
 * @class
 */
class Quality {
    constructor(qrInconsistency, minConvexCoefficient, maxOverlength, maxUnderlength, iterations, supportSize) {
        if (this.qrInconsistency === undefined)
            this.qrInconsistency = 0;
        if (this.minConvexCoefficient === undefined)
            this.minConvexCoefficient = 0;
        if (this.maxOverlength === undefined)
            this.maxOverlength = 0;
        if (this.maxUnderlength === undefined)
            this.maxUnderlength = 0;
        if (this.iterations === undefined)
            this.iterations = 0;
        if (this.supportSize === undefined)
            this.supportSize = 0;
        this.qrInconsistency = qrInconsistency;
        this.minConvexCoefficient = minConvexCoefficient;
        this.maxOverlength = maxOverlength;
        this.maxUnderlength = maxUnderlength;
        this.iterations = iterations;
        this.supportSize = supportSize;
    }

    /**
     * A measure for the quality of the internally used support points.
     * <p>
     * The returned number should in theory be zero (but may be non-zero due to rounding errors).
     * @return {number}
     */
    getQrInconsistency() {
        return this.qrInconsistency;
    }

    /**
     * A measure for the minimality of the computed ball.
     *
     * The returned number should in theory be non-zero and positive. Due to rounding errors, it may
     * be negative.
     * @return {number}
     */
    getMinConvexCoefficient() {
        return this.minConvexCoefficient;
    }

    /**
     * The maximal over-length of a point from the input set, relative to the computed miniball's
     * radius.
     * <p>
     * For each point <i>p</i> from the input point set, it is computed how far it is <i>outside</i>
     * the miniball ("over-length"). The returned number is the maximal such over-length, divided by
     * the radius of the computed miniball.
     * <p>
     * Notice that {@code getMaxOverlength() == 0} if and only if all points are contained in the
     * miniball.
     *
     * @return {number} the maximal over-length, a number ≥ 0
     */
    getMaxOverlength() {
        return this.maxOverlength;
    }

    /**
     * The maximal under-length of a point from the input set, relative to the computed miniball's
     * radius.
     * <p>
     * For each point <i>p</i> from the input point set, it is computed how far one has to walk from
     * this point towards the boundary of the miniball ("under-length"). The returned number is the
     * maximal such under-length, divided by the radius of the computed miniball.
     * <p>
     * Notice that in theory {@code getMaxUnderlength()} should be zero, otherwise the computed
     * miniball is enclosing but not minimal.
     *
     * @return {number} the maximal under-length, a number ≥ 0
     */
    getMaxUnderlength() {
        return this.maxUnderlength;
    }

    /**
     * The number of iterations that the algorithm needed to compute the miniball.
     *
     * @return {number} number of iterations
     */
    getIterations() {
        return this.iterations;
    }

    /**
     * The size of the support.
     * <p>
     * Refer to the documentation of {@link Miniball#support()} for more information on the
     * <i>support</i>.
     *
     * @return {number} size of the support
     */
    getSupportSize() {
        return this.supportSize;
    }

    /**
     *
     * @return {string}
     */
    toString() {
        return "Quality [qrInconsistency=" + this.qrInconsistency + ", minConvexCoefficient=" + this.minConvexCoefficient + ", maxOverlength=" + this.maxOverlength + ", maxUnderlength=" + this.maxUnderlength + ", iterations=" + this.iterations + ", supportSize=" + this.supportSize + "]";
    }
}

export { Quality };
