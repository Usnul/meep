/**
 * Created by Alex on 21/03/2017.
 */

import LabelView from '../../common/LabelView.js';
import View from '../../../View.js';
import ImageView from "../image/ImageView.js";
import domify from "../../../DOM.js";

class ButtonView extends View {
    /**
     *
     * @param {function} action
     * @param {string|ObservedString} [name]
     * @param {string} [icon] URL
     * @param {string[]} [classList]
     * @param {object} [css]
     * @constructor
     */
    constructor({ action, name, icon = undefined, classList = [], css }) {
        super();

        if (typeof action !== "function") {
            throw new Error("Action must be a function");
        }

        const dRoot = domify();

        this.el = dRoot.el;
        //add background and foreground elements for styling purposes

        const dForeground = domify();

        dForeground.addClass('foreground');

        const dBackground = domify();

        dBackground.addClass('background');

        dRoot.append(dForeground);
        dRoot.append(dBackground);

        dRoot.addClass('ui-button-view');

        if (css !== undefined) {
            this.css(css);
        }

        for (let i = 0, l = classList.length; i < l; i++) {
            const className = classList[i];
            dRoot.addClass(className);
        }

        this.el.addEventListener('click', action);


        if (name !== undefined) {
            const vName = new LabelView(name);
            this.addChild(vName);

            this.size.onChanged.add(function (x, y) {
                vName.size.set(x, y);
            });
        }

        if (icon !== undefined) {
            const vIcon = new ImageView(icon);
            this.addChild(vIcon);
        }

    }
}


export default ButtonView;
