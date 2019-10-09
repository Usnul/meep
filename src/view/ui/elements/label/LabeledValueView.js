/**
 * Created by Alex on 08/08/2016.
 */


import View from "../../../View";
import dom from "../../../DOM";
import LabelView from "../../common/LabelView";
import { assert } from "../../../../model/core/assert.js";


function labelValueViewFactory(value) {
    const lValue = new LabelView(value);
    lValue.el.classList.remove('label');

    return lValue;
}

class LabeledValueView extends View {
    /**
     * @template T
     * @param {string} klass
     * @param {string|ObservedString} label
     * @param {T} value
     * @param {string} [unit]
     * @param {function(T):View} [valueViewFactory]
     * @constructor
     */
    constructor({ klass, label, value, unit, valueViewFactory = labelValueViewFactory }) {
        super(klass, label, value, unit, valueViewFactory);

        const dRoot = dom('div').addClass('labeled-value').addClass(klass);
        this.el = dRoot.el;


        const vLabel = new LabelView(label);

        /**
         *
         * @type {LabelView}
         */
        this.vLabel = vLabel;

        this.addChild(vLabel);

        const vValue = valueViewFactory(value, unit);
        vValue.addClass('value');

        assert.notEqual(vValue, undefined, 'value view is undefined');

        this.addChild(vValue);

        this.vValue = vValue;

        if (unit !== undefined) {
            //add unit if it exists
            const lUnit = new LabelView(unit, { classList: ['unit'] });
            lUnit.el.classList.remove('label');

            this.addChild(lUnit);
        }

    }
}



export default LabeledValueView;
