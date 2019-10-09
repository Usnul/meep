import View from "../../View.js";


export class CanvasView extends View {
    constructor() {
        super();

        const canvas = document.createElement('canvas');
        this.el = canvas;

        this.context2d = canvas.getContext('2d');

        this.size.onChanged.add(function (x, y) {
            canvas.width = x;
            canvas.height = y;
        });
    }
}



export { CanvasView };
