/**
 * Created by Alex on 06/03/2017.
 */

import View from "../../View";
import dom from "../../DOM";

class EmptyView extends View {
    /**
     *
     * @param options
     * @extends {View}
     * @constructor
     */
    constructor({ classList = [], tag = 'div', css } = {}) {
        super(classList, tag);

        this.dRoot = dom(tag);


        const elClassList = this.dRoot.el.classList;
        for (let i = 0, l = classList.length; i < l; i++) {
            const className = classList[i];
            elClassList.add(className);
        }

        this.el = this.dRoot.el;

        if (css !== undefined) {
            this.css(css);
        }
    }
}


export default EmptyView;
