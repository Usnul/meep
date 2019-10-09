import View from "../../View";
import dom from "../../DOM";
import Vector2 from "../../../model/core/geom/Vector2";
import { forceIntoBox, pullBoxTowardsPoint, resolveAABB2Overlap } from "../../../model/diagram/graph/BoxLayouter.js";
import AABB2 from "../../../model/core/geom/AABB2";
import { CompassArrowView } from "../elements/CompassArrowView";
import EmptyView from "../elements/EmptyView.js";
import { EPSILON } from "../../../model/core/math/MathUtils.js";


class TooltipView extends View {
    /**
     *
     * @param {VisualTip} tip
     * @param {View} contentView
     * @constructor
     */
    constructor(tip, contentView) {
        super();


        /**
         *
         * @type {VisualTip}
         */
        this.model = tip;

        //build dom tree
        const dRoot = dom('div').addClass("tooltip-view");
        //set dom element
        this.el = dRoot.el;

        const vContents = new EmptyView({ classList: ['contents'] });

        this.addChild(vContents);

        vContents.addChild(contentView);

        this.contentView = vContents;


        const vCompass = new CompassArrowView();

        this.addChild(vCompass);

        this.compass = vCompass;
    }

    /**
     *
     * @param {AABB2} bounds
     */
    layout(bounds) {
        const tipBox = element2aabb(this.contentView.el);

        const SPACING = 16;

        tipBox.grow(SPACING);

        /**
         *
         * @type {VisualTip}
         */
        const tip = this.model;

        const tipTarget = tip.target;

        const target = rectangle2aabb(tipTarget);

        const box = positionBoxNextToBox(tipBox, target, bounds);

        box.shrink(SPACING);

        const compass = this.compass;

        function setCompas() {

            const targetCenter = new Vector2(target.midX(), target.midY());

            const tipPoint = new Vector2();

            box.computeNearestPointToPoint(targetCenter, tipPoint);

            compass.rotateFromDirectionVector(targetCenter.x - tipPoint.x, targetCenter.y - tipPoint.y);

            compass.position.copy(tipPoint)._add(-box.x0, -box.y0);
        }

        setCompas();

        this.position.set(box.x0, box.y0)
    }
}


/**
 *
 * @param {Element} el
 * @returns {AABB2}
 */
function element2aabb(el) {
    const clientRect = el.getBoundingClientRect();

    return new AABB2(clientRect.left, clientRect.top, clientRect.right, clientRect.bottom);
}

/**
 *
 * @param {Rectangle} rect
 * @returns {AABB2}
 */
function rectangle2aabb(rect) {
    const position = rect.position;

    const x0 = position.x;
    const y0 = position.y;

    const size = rect.size;

    const x1 = size.x + x0;
    const y1 = size.y + y0;

    return new AABB2(x0, y0, x1, y1);
}

/**
 *
 * @param {AABB2} box
 * @param {AABB2} target
 * @param {AABB2} bounds
 * @returns {Vector2}
 */
function computeInitialPlacement(box, target, bounds) {
    /**
     * list of preferred directions, ordered. First direction is higher priority than the next, last is lowest priority
     * @type {Vector2[]}
     */
    const preferredDirections = [
        Vector2.up,
        Vector2.right,
        Vector2.down,
        Vector2.left
    ];

    const targetCenter = new Vector2(target.midX(), target.midY());

    const targetH = target.getHeight();
    const targetW = target.getWidth();

    const targetDiagonal = Math.sqrt(targetH * targetH + targetW * targetW);

    const boxWidth = box.getWidth();
    const boxHeight = box.getHeight();

    const boxWidth_2 = boxWidth / 2;
    const boxHeight_2 = boxHeight / 2;

    const intersectionPoint = new Vector2();

    const placements = preferredDirections.map(function (direction) {
        //invert Y axis, screen-space direction is Down(+) and Up(-)
        const viewportDirection = direction.clone()._multiply(1, -1);

        const pointOutside = viewportDirection.clone();
        //scale vector to be larger than the box diagonal so it would intersect the boundary when placed in the middle
        pointOutside.multiplyScalar(targetDiagonal + 1);
        //move vector to the middle od the box
        pointOutside.add(targetCenter);

        target.lineIntersectionPoint(targetCenter, pointOutside, intersectionPoint);

        //align placement to the opposite edge of the box
        const offset = new Vector2(boxWidth_2, boxHeight_2);

        offset.multiply(viewportDirection);

        offset._sub(boxWidth_2, boxHeight_2);

        offset.add(intersectionPoint);

        return offset;
    });

    /**
     *
     * @param {Vector2} placement
     * @returns {number}
     */
    function computePlacementScore(placement) {
        //find space for the tip between bounds and the target
        const availableSpace = new AABB2();

        const px0 = placement.x;
        const px1 = px0 + boxWidth;
        const py0 = placement.y;
        const py1 = py0 + boxHeight;

        if (px1 <= target.x0) {
            //left
            availableSpace.set(
                bounds.x0,
                bounds.y0,
                target.x0,
                bounds.y1
            );
        } else if (px0 >= target.x1) {
            //right
            availableSpace.set(
                target.x1,
                bounds.y0,
                bounds.x1,
                bounds.y1
            );
        } else if (py1 <= target.y0) {
            //up
            availableSpace.set(
                bounds.x0,
                bounds.y0,
                bounds.x1,
                target.y0
            );
        } else if (py0 >= target.y1) {
            //bottom
            availableSpace.set(
                bounds.x0,
                target.y1,
                bounds.x1,
                bounds.y1
            );
        } else {
            //tip is inside, no arbitration
        }

        let score = 0;

        const availableWidth = availableSpace.getWidth();
        const availableHeight = availableSpace.getHeight();

        const spareWidth = availableWidth - boxWidth;
        const spareHeight = availableHeight - boxHeight;

        if (spareHeight < 0) {
            score--;
        }

        if (spareWidth < 0) {
            score--;
        }

        return score;
    }

    //score placements
    const scores = placements.map(computePlacementScore);

    //find best placement
    let bestIndex = 0;
    let bestScore = scores[0];

    for (let i = 1; i < scores.length; i++) {
        const score = scores[i];

        if (score > bestScore + EPSILON) {
            bestScore = score;
            bestIndex = i;
        }
    }

    return placements[bestIndex];
}


/**
 *
 * @param {AABB2} box
 * @param {AABB2} target
 * @param {AABB2} bounds
 */
function positionBoxNextToBox(box, target, bounds) {
    const b = box.clone();
    const t = target.clone();

    //center box inside the bounds
    const y0 = (bounds.getHeight() + b.getHeight()) / 2;
    const x0 = (bounds.getWidth() + b.getWidth()) / 2;
    b.set(x0, y0, x0 + b.getWidth(), y0 + b.getHeight());


    const targetCenter = new Vector2(t.midX(), t.midY());

    t.locked = true;

    function touch() {

        const bC = new Vector2(b.midX(), b.midY());

        const bE = new Vector2();
        const tE = new Vector2();


        t.lineIntersectionPoint(bC, targetCenter, tE);
        const delta = new Vector2();

        if (b.lineIntersectionPoint(bC, targetCenter, bE)) {
            delta.copy(tE).sub(bE);
        } else {
            delta.copy(tE).sub(bC);
        }

        b.move(delta.x, delta.y);
    }


    const initialPosition = computeInitialPlacement(b, t, bounds);
    //set bounds to initial position
    b.set(initialPosition.x, initialPosition.y, initialPosition.x + b.getWidth(), initialPosition.y + b.getHeight());

    // touch();

    function step() {
        //pull
        pullBoxTowardsPoint(b, initialPosition.x + b.getWidth() / 2, initialPosition.y + b.getHeight() / 2, 0.1);

        resolveAABB2Overlap([b, t], 10);

        forceIntoBox(bounds, [b]);
    }

    for (let i = 0; i < 5; i++) {
        step();
    }

    box.copy(b);

    return box;
}

export default TooltipView;
