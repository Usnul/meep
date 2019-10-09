import View from "../../../../View.js";
import { DomSizeObserver } from "../../../../ui/util/DomSizeObserver.js";

/**
 * @extends View
 */
export class AutoCanvasView extends View {
    constructor({ classList = [] } = {}) {
        super();

        this.el = document.createElement('canvas');
        classList.forEach(c => this.addClass(c));

        /**
         *
         * @type {CanvasRenderingContext2D}
         */
        this.context2d = this.el.getContext('2d');

        const sizeObserver = new DomSizeObserver();

        const size = sizeObserver.dimensions.size;
        size.onChanged.add(() => {
            this.render();
        });

        sizeObserver.attach(this.el);

        this.sizeObserver = sizeObserver;

        this.on.linked.add(() => {
            sizeObserver.start();
            this.render();
        });
        this.on.unlinked.add(() => sizeObserver.stop());
    }

    render() {
        const dimensions = this.sizeObserver.dimensions;
        const size = dimensions.size;

        const width = size.x;
        const height = size.y;

        if (width < 0 || height < 0) {
            //canvas too small
            return;
        }

        this.el.width = width;
        this.el.height = height;

        this.draw(this.context2d, width, height);
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     */
    draw(ctx, width, height) {
        //override this method
    }
}
