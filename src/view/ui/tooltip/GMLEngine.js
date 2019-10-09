import { parseTooltipString, TooltipTokenType as TokenType } from "./TooltipParser.js";
import View from "../../View.js";
import LabelView from "../common/LabelView.js";
import EmptyView from "../elements/EmptyView.js";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";

/**
 *
 * @param {object} values
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceAction(values, localization, gml, tooltips) {
    const actionDescription = database.actions.get(id);

    const name = actionDescription.name;

    return new LabelView(name);
}


/**
 *
 * @param {number} value
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceMoney({ value }, localization, gml, tooltips) {

    return new LabelView(value, {
        tag: 'span'
    });
}

/**
 * @param {object} values
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
function compileReferenceStat(values, localization, gml, tooltips) {
    const id = values.id;
    const _case = values.case !== undefined ? values.case : "nominative";

    let key = `system_combat_unit_stat.${id}.name.case.${_case}`;

    if (!localization.hasString(key)) {
        //drop the case

        console.warn(`Key not found ${key}, dropping the case`);

        key = `system_combat_unit_stat.${id}.name`;
    }

    const view = new LocalizedLabelView({
        id: key,
        localization,
        tag: 'span'
    });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        const code = localization.getString(`system_combat_unit_stat.${id}.tip`, {
            reduction: ''
        });

        tooltips.manage(view, () => gml.compile(code));
    }

    return view;
}

const referenceCompilers = {
    action: compileReferenceAction,
    stat: compileReferenceStat,
    money: compileReferenceMoney
};

class GMLContextFrame {
    constructor() {
        this.enableTooltips = true;
    }
}

const RECURSION_LIMIT = 50;

/**
 * Game Markup Language
 */
export class GMLEngine {

    constructor() {

        /**
         *
         * @type {StaticKnowledgeDatabase}
         */
        this.database = null;
        /**
         *
         * @type {Localization}
         */
        this.localization = null;

        /**
         *
         * @type {DomTooltipManager}
         */
        this.tooltips = null;

        /**
         * Used to prevent infinite recursion
         * @type {number}
         * @private
         */
        this.__recursionCount = 0;

        /**
         *
         * @type {Array}
         * @private
         */
        this.__recursionReferencePath = [];

        /**
         *
         * @type {GMLContextFrame[]}
         */
        this.__contextStack = [];

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__tooltipsEnabled = true;
    }

    /**
     *
     * @returns {boolean}
     */
    getTooltipsEnabled() {
        return this.__tooltipsEnabled;
    }

    /**
     *
     * @param {boolean} v
     */
    setTooltipsEnabled(v) {
        this.__tooltipsEnabled = v;
    }

    /**
     * @param {Localization} localization
     */
    initialize(localization) {
        this.localization = localization;
    }

    /**
     *
     * @returns {Promise<any>}
     */
    startup() {
        return Promise.resolve();
    }

    /**
     *
     * @param {String} type
     * @returns {number}
     */
    getReferenceDepth(type) {
        let result = 0;

        const path = this.__recursionReferencePath;

        const pathLength = path.length;

        for (let i = 0; i < pathLength; i++) {
            const r = path[i];
            if (r.type === type) {
                result++;
            }
        }

        return result;
    }

    /**
     *
     * @param {Token[]} tokens
     * @param {View} [target]
     * @returns {View}
     * @private
     */
    compileTokens(tokens, target = new EmptyView({ tag: 'span' })) {
        const localization = this.localization;
        const tooltips = this.tooltips;

        const gml = this;

        /**
         *
         * @param {Token} token
         */
        function compileTextToken(token) {
            return new LabelView(token.value, { tag: 'span' });
        }

        function compileReferenceToken(token) {
            /**
             * @type {TooltipReferenceValue}
             */
            const reference = token.value;

            const refType = reference.type.toLocaleLowerCase();

            const referenceCompiler = referenceCompilers[refType];

            if (referenceCompiler === undefined) {
                //unknown reference type
                console.error(`unknown reference type '${refType}'`);
                return;
            }

            let view;

            gml.__recursionReferencePath.push(reference);

            try {
                view = referenceCompiler(reference.values, localization, gml, tooltips);
            } catch (e) {
                console.error(`Failed to compile reference token`, token, 'ERROR:', e, 'token stream:', tokens);
                view = new LabelView('ERROR');
            }

            gml.__recursionReferencePath.pop();

            view.addClass('reference-type-' + refType);

            return view;
        }


        //style stack
        const styleSet = [];


        let containerElement = target;

        function makeStyleContainer() {
            const view = new EmptyView({ tag: 'span' });

            styleSet.forEach(n => view.addClass(n));

            return view;
        }

        function pushStyle(name) {
            styleSet.push(name);

            const el = makeStyleContainer();

            target.addChild(el);

            containerElement = el;
        }

        function popStyle(name) {
            const i = styleSet.indexOf(name);

            if (i === -1) {
                console.error(`encountered closing token for a style(name=${name}) that is not open. Current style set: [${styleSet}]`);
                //bail
                return;
            }

            styleSet.splice(i, 1);

            if (styleSet.length === 0) {
                containerElement = target;
            } else {
                //close current container and start a new one
                const el = makeStyleContainer();

                target.addChild(el);

                containerElement = el;
            }
        }

        tokens.forEach(t => {
            let childView;
            const tokenType = t.type;

            if (tokenType === TokenType.Reference) {
                childView = compileReferenceToken(t);
            } else if (tokenType === TokenType.Text) {
                childView = compileTextToken(t);
            } else if (tokenType === TokenType.StyleStart) {
                pushStyle(t.value);
            } else if (tokenType === TokenType.StyleEnd) {
                popStyle(t.value);
            } else {
                throw new TypeError(`Unsupported token type '${tokenType}'`);
            }

            if (childView !== undefined) {
                containerElement.addChild(childView);
            }
        });

        return target;
    }

    pushState() {
        const frame = new GMLContextFrame();

        frame.enableTooltips = this.__tooltipsEnabled;

        this.__contextStack.push(frame);
    }

    popState() {
        const frame = this.__contextStack.pop();

        this.__tooltipsEnabled = frame.enableTooltips;
    }

    /**
     *
     * @param {string} code
     * @param {View} [target]
     * @returns {View}
     */
    compile(code, target) {
        if (this.__recursionCount >= RECURSION_LIMIT) {
            console.error(`Hit recursion limit(=${RECURSION_LIMIT}), returning empty view`);
            return new EmptyView();
        } else {

            this.__recursionCount++;

            this.pushState();

            try {
                const tokens = parseTooltipString(code);

                const view = this.compileTokens(tokens, target);

                return view;
            } finally {

                //restore frame
                this.popState();

                this.__recursionCount--;

            }

        }
    }

}
