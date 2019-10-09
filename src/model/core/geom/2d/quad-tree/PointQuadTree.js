/**
 * Created by Alex on 31/10/2014.
 */


import { assert } from "../../../assert.js";

const maxElements = 12;
const minElements = 1;

/**
 *
 * @param {*} obj
 * @param {number} x
 * @param {number} y
 * @constructor
 */
const Element = function (obj, x, y) {
    /**
     *
     * @type {number}
     */
    this.x = x;
    /**
     *
     * @type {number}
     */
    this.y = y;

    this.value = obj;

    /**
     *
     * @type {PointQuadTree|null}
     */
    this.parentNode = null;
};

/**
 *
 * @param {number} x
 * @param {number} y
 */
Element.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
    //check if new position is outside of the parent node
    const parentNode = this.parentNode;
    let node = parentNode;
    while (x <= node.x0 || x > node.x1 || y <= node.y0 || y > node.y1) {
        if (node.parentNode === null) {
            //root
            node.resizeToFit(x, y);
            break;
        }
        //outside of the node
        node = node.parentNode;
    }
    //found containing node
    if (node === parentNode) {
        //still inside the parent node
        return;
    }
    parentNode.removeElement(this);
    node.insertElement(this);
};

Element.prototype.remove = function () {
    assert.notEqual(this.parentNode, null, 'parentNode is null');

    this.parentNode.removeElement(this);
};

class PointQuadTree {
    /**
     * @param {number} [x0]
     * @param {number} [y0]
     * @param {number} [x1]
     * @param {number} [y1]
     * @constructor
     */
    constructor(x0 = 0, y0 = 0, x1 = 0, y1 = 0) {
        //
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;

        this.parentNode = null;

        this.setHalfSize(this.x0, this.y0, this.x1, this.y1);


        this.elements = [];
        this.numElements = 0;

        this.tl = void 0;
        this.tr = void 0;
        this.bl = void 0;
        this.br = void 0;
    }

    reduce() {
        if (this.isLeaf()) {
            //leaf
            this.bubbleElementsUp();
        } else {
            const tl = this.tl;
            const tr = this.tr;
            const bl = this.bl;
            const br = this.br;
            tl.reduce();
            tr.reduce();
            bl.reduce();
            br.reduce();
            //
            if (tl.isLeaf() && tr.isLeaf() && bl.isLeaf() && br.isLeaf()
                && tl.numElements === 0 && tr.numElements === 0 && bl.numElements === 0 && br.numElements === 0) {
                this.tl = void 0;
                this.tr = void 0;
                this.bl = void 0;
                this.br = void 0;
            }
        }
    }

    insertElement(element) {
        if (this.numElements < maxElements) {

            this.numElements++;
            this.elements.push(element);
            element.parentNode = this;

        } else {

            //check for split
            if (this.tl === void 0) {
                this.split();
            }

            //find suitable child to take element
            const x = element.x;
            const y = element.y;

            if (x < this.hx) {
                if (y < this.hy) {
                    this.tl.insertElement(element);
                } else {
                    this.bl.insertElement(element);
                }
            } else {
                if (y < this.hy) {
                    this.tr.insertElement(element);
                } else {
                    this.br.insertElement(element);
                }
            }
        }
    }

    clear() {
        this.elemenets = [];

        this.tl = undefined;
        this.tr = undefined;
        this.bl = undefined;
        this.br = undefined;
    }

    insert(p, x, y) {
        const element = new Element(p, x, y);

        this.resizeToFit(x, y); //adjust size if needed

        this.insertElement(element);

        return element;
    }

    traversePreOrder(visitor) {
        const keepGoing = visitor(this);
        if (keepGoing !== false && this.tl !== void 0) {
            this.tl.traversePreOrder(visitor);
            this.tr.traversePreOrder(visitor);
            this.bl.traversePreOrder(visitor);
            this.br.traversePreOrder(visitor);
        }
    }

    absorbElement(element) {
        this.elements.push(element);
        this.numElements++;
    }

    resizeToFit(x, y) {
        let _x0 = this.x0,
            _y0 = this.y0,
            _x1 = this.x1,
            _y1 = this.y1;

        if (x < _x0) {
            _x0 = x;
        } else if (x > _x1) {
            _x1 = x;
        }

        if (y < _y0) {
            _y0 = y;
        } else if (y > _y1) {
            _y1 = y;
        }

        if (this.x0 !== _x0 || this.y0 !== _y0 || this.x1 !== _x1 || this.y1 !== _y1) {
            this.resize(_x0, _y0, _x1, _y1);
        }

    }

    isLeaf() {
        return this.tl === void 0;
    }

    setHalfSize(x0, y0, x1, y1) {
        this.hx = (x1 + x0) / 2;
        this.hy = (y1 + y0) / 2;
    }

    traverseRect(_x0, _y0, _x1, _y1, visitor) {
        //check elements
        for (let i = 0; i < this.numElements; i++) {
            const element = this.elements[i];
            const x = element.x;
            const y = element.y;
            if (x > _x0 && x < _x1 && y > _y0 && y < _y1) {
                visitor(element);
            }
        }
        if (!this.isLeaf()) {
            //if we have children - check them
            if (_x0 <= this.hx) {
                if (_y0 <= this.hy) {
                    this.tl.traverseRect(_x0, _y0, _x1, _y1, visitor);
                }
                if (_y1 >= this.hy) {
                    this.bl.traverseRect(_x0, _y0, _x1, _y1, visitor);
                }
            }
            if (_x1 >= this.hx) {
                if (_y0 <= this.hy) {
                    this.tr.traverseRect(_x0, _y0, _x1, _y1, visitor);
                }
                if (_y1 >= this.hy) {
                    this.br.traverseRect(_x0, _y0, _x1, _y1, visitor);
                }
            }
        }
    }

    traverse(visitor, thisArg) {
        this.elements.forEach(visitor, thisArg);
        if (this.tl !== void 0) {
            this.tl.traverse(visitor, thisArg);
            this.tr.traverse(visitor, thisArg);
            this.bl.traverse(visitor, thisArg);
            this.br.traverse(visitor, thisArg);
        }
    }

    traverseCircle(cX, cY, r, visitor) {
        this.traverseCircleSqr(cX, cY, r, r * r, visitor);
    }

    split() {
        //generate children
        const hx = this.hx;
        const hy = this.hy;

        this.tl = new PointQuadTree(this.x0, this.y0, hx, hy);
        this.tr = new PointQuadTree(hx, this.y0, this.x1, hy);
        this.bl = new PointQuadTree(this.x0, hy, hx, this.y1);
        this.br = new PointQuadTree(hx, hy, this.x1, this.y1);

        //set parent node
        this.tl.parentNode = this;
        this.tr.parentNode = this;
        this.bl.parentNode = this;
        this.br.parentNode = this;
    }

    merge() {
        //check if split at all
        if (this.isLeaf()) {
            return; //not split
        }


        //merge children
        this.tl.traverse(this.absorbElement, this);
        this.tr.traverse(this.absorbElement, this);
        this.bl.traverse(this.absorbElement, this);
        this.br.traverse(this.absorbElement, this);
        //
        this.tl = void 0;
        this.tr = void 0;
        this.bl = void 0;
        this.br = void 0;
    }

    validateNode() {
        if (this.hx !== (this.x0 + this.x1) / 2) {
            return false;
        }
        if (this.hy !== (this.y0 + this.y1) / 2) {
            return false;
        }
        if (!this.isLeaf()) {
            if (this.tl.parentNode !== this
                || this.tr.parentNode !== this
                || this.bl.parentNode !== this
                || this.br.parentNode !== this) {
                return false;
            }
            if (this.tl.x0 !== this.x0 || this.tl.x1 !== this.hx || this.tl.y0 !== this.y0 || this.tl.y1 !== this.hy) {
                return false;
            }
            if (this.tr.x0 !== this.hx || this.tr.x1 !== this.x1 || this.tr.y0 !== this.y0 || this.tr.y1 !== this.hy) {
                return false;
            }
            if (this.bl.x0 !== this.x0 || this.bl.x1 !== this.hx || this.bl.y0 !== this.hy || this.bl.y1 !== this.y1) {
                return false;
            }
            if (this.br.x0 !== this.hx || this.br.x1 !== this.x1 || this.br.y0 !== this.hy || this.br.y1 !== this.y1) {
                return false;
            }
        } else if (this.elements !== void 0) {

            //check containment of elements
            for (let i = 0; i < this.elements.length; i++) {
                const e = this.elements[i];
                if (e.x < this.x0 || e.x > this.x1 || e.y < this.y0 || e.y > this.y1) {
                    return false;
                }
            }

        }
        return true;
    }

    traverseCircleSqr(cX, cY, r, r2, visitor) {
        for (let i = 0; i < this.numElements; i++) {
            const element = this.elements[i];
            const x = element.x;
            const y = element.y;
            const dx = cX - x;
            const dy = cY - y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) {
                visitor(element);
            }
        }

        if (cX - r < this.hx) {
            if (cY - r < this.hy) {
                this.tl.traverseCircleSqr(cX, cY, r, r2, visitor);
            }
            if (cY + r >= this.hy) {
                this.bl.traverseCircleSqr(cX, cY, r, r2, visitor);
            }
        }
        if (cX + r >= this.hx) {
            if (cY - r < this.hy) {
                this.tr.traverseCircleSqr(cX, cY, r, r2, visitor);
            }
            if (cY + r >= this.hy) {
                this.br.traverseCircleSqr(cX, cY, r, r2, visitor);
            }
        }
    }

    resize(_x0, _y0, _x1, _y1) {
        const parentNode = this.parentNode;
        if (parentNode !== null) {
            const w = _x1 - _x0;
            const h = _y1 - _y0;
            if (this === parentNode.tl) {
                parentNode.resize(_x0, _y0, _x1 + w, _y1 + h);
            } else if (this === parentNode.tr) {
                parentNode.resize(_x0 - w, _y0, _x1, _y1 + h);
            } else if (this === parentNode.bl) {
                parentNode.resize(_x0, _y0 - h, _x1 + w, _y1);
            } else if (this === parentNode.br) {
                parentNode.resize(_x0 - w, _y0 - h, _x1, _y1);
            } else {
                throw  new Error("Specified 'parent' does not own this node");
            }
            return;
        }
        this.x0 = this.x0 = _x0;
        this.y0 = this.y0 = _y0;
        this.x1 = this.x1 = _x1;
        this.y1 = this.y1 = _y1;

        this.setHalfSize(_x0, _y0, _x1, _y1);

        this.merge();
        //reinsert all elements
        const l = this.numElements;
        const els = this.elements;
        this.elements = [];
        this.numElements = 0;
        for (let i = 0; i < l; i++) {
            this.insertElement(els[i]);
        }
    }

    removeElement(e) {

        const i = this.elements.indexOf(e);

        this.elements.splice(i, 1);

        // reset parent
        e.parentNode = null;

        this.numElements--;

        if (this.numElements < minElements) {
            // number of elements in the current bucket is too small, attempt reduction
            this.reduce();
        }

    }

    bubbleElementsUp() {
        let targetNode = this;
        while (this.numElements > 0 && targetNode.parentNode !== null) {
            targetNode = targetNode.parentNode;
            const parentElements = targetNode.numElements;
            const capacityLeft = maxElements - parentElements;
            if (capacityLeft > 0) {
                const transferNumber = Math.min(capacityLeft, this.numElements);
                for (let i = this.numElements - transferNumber; i < this.numElements; i++) {
                    const element = this.elements[i];
                    targetNode.insertElement(element);
                }
                this.numElements -= transferNumber;
            }
        }
        this.elements.length = this.numElements;
    }

    validate() {
        let v = true;
        this.traversePreOrder(function (node) {
            let isValid = node.validateNode();
            if (!isValid && v !== false) {
                v = false;
            }
            return isValid;
        });
        return v;
    }
}

export default PointQuadTree;
