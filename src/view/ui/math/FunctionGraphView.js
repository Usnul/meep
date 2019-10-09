import View from "../../View.js";
import { returnZero } from "../../../model/core/function/Functions.js";

export class FunctionGraphView extends View {
    /**
     *
     * @param {function(number):number} f
     * @param {String|number} color CSS color
     */
    constructor(
        {
            f = returnZero,
            color = "black",
        } = {}
    ) {
        super();

        this.el = document.createElement('canvas');

        this.ctx = this.el.getContext('2d');

        this.size.onChanged.add((x, y) => {
            this.el.width = x;
            this.el.height = y;

            this.render();
        });


        this.settings = {
            color
        };

        /**
         *
         * @type {function(number):number}
         */
        this.f = f;
    }

    render() {
        /**
         *
         * @type {CanvasRenderingContext2D}
         */
        const ctx = this.ctx;

        const size = this.size;

        /**
         *
         * @type {function(number): number}
         */
        const f = this.f;

        function readCanvasY(x){

            const v = f(x);

            //scale v
            return (1 - v) * size.y;
        }

        // Clear canvas
        ctx.clearRect(0, 0, size.x, size.y);

        ctx.beginPath();
        ctx.moveTo(0, readCanvasY(0));

        const canvasWidth = size.x;

        for (let i = 0; i < canvasWidth; i++) {
            const x = (i + 1) / (canvasWidth);

            //scale v
            const j = readCanvasY(x);

            ctx.lineTo(i, j);
        }

        ctx.strokeStyle = this.settings.color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
