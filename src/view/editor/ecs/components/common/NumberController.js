import View from "../../../../View.js";
import Vector1 from "../../../../../model/core/geom/Vector1.js";

export class NumberController extends View {
    /**
     *
     * @param {string[]} [classList]
     */
    constructor({ classList = [] } = {}) {
        super();

        const value = new Vector1(0);

        /**
         *
         * @type {Vector1}
         */
        this.value = value;

        const el = document.createElement('input');
        this.el = el;

        classList.forEach(c => this.addClass(c));

        el.setAttribute('type', 'text');

        el.classList.add('ui-number-controller');

        let lockForward = false;

        function data2view() {

            if(lockForward){
                return;
            }

            el.value = value.getValue();

        }

        function view2data() {
            lockForward = true;

            value.set(parseFloat(el.value));

            lockForward = false;
        }

        value.process(data2view);

        el.addEventListener('input', view2data);
    }
}
