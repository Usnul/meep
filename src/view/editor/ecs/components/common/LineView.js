import View from "../../../../View.js";

/**
 * @extends {View}
 */
export class LineView extends View {
    constructor({ elements = [], classList = [] }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-line-view');

        classList.forEach(c => this.addClass(c));

        elements.forEach(e => this.addChild(e));
    }
}