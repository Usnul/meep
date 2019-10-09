import { Node2 } from "./Node2.js";

export class LeafNode2 extends Node2 {
    constructor(value, x0, y0, x1, y1) {
        super(x0, y0, x1, y1);

        this.value = value;
    }
}

LeafNode2.prototype.isLeafNode = true;