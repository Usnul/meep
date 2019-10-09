import View from "../../View.js";
import domify from "../../DOM.js";
import { assert } from "../../../model/core/assert.js";

/**
 * @extends View
 */
export class LocalizedLabelView extends View {
    /**
     *
     * @param {string} id
     * @param {object} [seed]
     * @param {Localization} localization
     * @param {string[]} [classList]
     * @param {GMLEngine} [gml] if supplied, string will be compiled first
     * @param {string} [tag=div] HTML element tag
     */
    constructor({ id, seed, localization, classList = [], gml, tag = 'div' }) {
        super();

        assert.typeOf(id, 'string', 'id');

        const $el = domify(tag);

        this.el = $el.el;

        this.addClass('label');
        classList.forEach(c => this.addClass(c));

        let needsUpdate = true;

        const self = this;

        /**
         * Load localized string value
         */
        function load() {
            const value = localization.getString(id, seed);

            if (gml === undefined) {
                $el.text(value);
            } else {
                self.removeAllChildren();
                //compile
                gml.compile(value, self);
            }

            needsUpdate = false;
        }

        this.on.linked.add(() => {
            if (needsUpdate) {
                load();
            }
        });

        // watch for locale changes
        this.bindSignal(localization.locale.onChanged, () => {
            if (this.isLinked) {
                load();
            } else {
                needsUpdate = true;
            }
        });
    }
}