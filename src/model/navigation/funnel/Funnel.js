/**
 * Created by Alex on 29/03/2014.
 */




const EPSILON = 0.000001;

function triarea2(a, b, c) {
    const ax = b.x - a.x;
    const ay = b.y - a.y;
    const bx = c.x - a.x;
    const by = c.y - a.y;

    return bx * ay - ax * by;
}

function vdistsqr(a, b) {
    const x = b.x - a.x;
    const y = b.y - a.y;

    return x * x + y * y;
}

function vequal(a, b) {
    return vdistsqr(a, b) < EPSILON;
}

function counterClockWise2(v0, v1, v2) {
    const vs = [v0, v1, v2];
    let a = 0;
    for (let i = 0; i < 3; i++) {
        const p0 = vs[i];
        const p1 = vs[(i + 1) % 3];
        a += (p1.x - p0.x) * (p1.y + p0.y);
    }
    return a < 0;
}

function counterClockWise(v0, v1, v2) {

    const a = (v0.x + v1.x) * (v0.y - v1.y) + (v1.x + v2.x) * (v1.y - v2.y);
    return a < 0;
}

function getOffsetVertex(prevPoint, currPoint, nextPoint, size) {
    if (prevPoint == currPoint || currPoint == nextPoint) {
        return new THREE.Vector2(currPoint.x, currPoint.y);
    }

    // Calculate line angles.
    const nextAngle = Math.atan2(nextPoint.y - currPoint.y, nextPoint.x - currPoint.x);
    const prevAngle = Math.atan2(currPoint.y - prevPoint.y, currPoint.x - prevPoint.x);

    // Calculate minimum distance between line angles.
    let distance = nextAngle - prevAngle;

    if (Math.abs(distance) > Math.PI) {
        distance -= distance > 0 ? Math.PI * 2 : -Math.PI * 2;
    }

    // Calculate left perpendicular to average angle.
    const angle = prevAngle + (distance / 2) + (Math.PI / 2);
    const normal = new THREE.Vector2(Math.cos(angle), Math.sin(angle));

    return normal.multiplyScalar(size).add(new THREE.Vector2(currPoint.x, currPoint.y));
}

function getPrev(list, currentIndex) {
    let prev = currentIndex;

    for (let i = prev; i >= 0; i--) {
        if (list[i] != list[prev]) {
            prev = i;
            break;
        }
    }

    return prev;
}

function getNext(list, currentIndex) {
    let next = currentIndex;

    for (let i = next; i < list.length; i++) {
        if (list[i] != list[next]) {
            next = i;
            break;
        }
    }

    return next;
}

function Channel() {
    this.portals = [];
}

Channel.prototype.push = function (p1, p2) {
    if (p2 === undefined) p2 = p1;
    this.portals.push({ left: p1, right: p2 });
};

Channel.prototype.fixLeftRight = function () {
    for (let i = 1; i < this.portals.length; i++) {
        const previous = this.portals[i - 1];
        const current = this.portals[i];
        let ccw = counterClockWise2(previous.right, current.right, current.left);
        if (!ccw) {
            const t = current.left;
            //swap
            current.left = current.right;
            current.right = t;
        }
    }
};

Channel.prototype.stringPull = function (agentSize) {
    const size = agentSize || 0;
    const portals = this.portals;
    const pts = [];
    // Init scan state
    let portalApex, portalLeft, portalRight;
    let apexIndex = 0, leftIndex = 0, rightIndex = 0;

    portalApex = portals[0].left;
    portalLeft = portals[0].left;
    portalRight = portals[0].right;

    // Add start point.
    pts.push(portalApex);

    for (let i = 1; i < portals.length; i++) {
        const left = portals[i].left;
        const right = portals[i].right;

        // Update right vertex.
        if (triarea2(portalApex, portalRight, right) <= 0.0) {
            if (vequal(portalApex, portalRight) || triarea2(portalApex, portalLeft, right) > 0.0) {
                // Tighten the funnel.
                portalRight = right;
                rightIndex = i;
            } else {
                // Right over left, insert left to path and restart scan from portal left point.
                const offsetLeftVertex = getOffsetVertex(portals[getPrev(portals, leftIndex)].left, portalLeft, portals[getNext(portals, leftIndex)].left, size);
                pts.push({ x: offsetLeftVertex.x, y: offsetLeftVertex.y });
                // Make current left the new apex.
                portalApex = portalLeft;
                apexIndex = leftIndex;
                // Reset portal
                portalLeft = portalApex;
                portalRight = portalApex;
                leftIndex = apexIndex;
                rightIndex = apexIndex;
                // Restart scan
                i = apexIndex;
                continue;
            }
        }

        // Update left vertex.
        if (triarea2(portalApex, portalLeft, left) >= 0.0) {
            if (vequal(portalApex, portalLeft) || triarea2(portalApex, portalRight, left) < 0.0) {
                // Tighten the funnel.
                portalLeft = left;
                leftIndex = i;
            } else {
                // Left over right, insert right to path and restart scan from portal right point.
                const offsetRightVertex = getOffsetVertex(portals[getPrev(portals, rightIndex)].right, portalRight, portals[getNext(portals, rightIndex)].right, size);
                pts.push({ x: offsetRightVertex.x, y: offsetRightVertex.y });
                // Make current right the new apex.
                portalApex = portalRight;
                apexIndex = rightIndex;
                // Reset portal
                portalLeft = portalApex;
                portalRight = portalApex;
                leftIndex = apexIndex;
                rightIndex = apexIndex;
                // Restart scan
                i = apexIndex;
                continue;
            }
        }
    }

    if ((pts.length == 0) || (!vequal(pts[pts.length - 1], portals[portals.length - 1].left))) {
        // Append last point to path.
        pts.push(portals[portals.length - 1].left);
    }

    this.path = pts;
    return pts;
};
export default Channel;

