import View from "../../View";
import dom from "../../DOM";

import LabelView from '../../ui/common/LabelView';
import { ProcessState } from "../../../model/editor/process/Process.js";

/**
 *
 * @param {ProcessState} state
 * @returns {string}
 */
function processState2ClassName(state) {
    return `process-state-${state}`;
}

class ProcessView extends View {
    /**
     *
     * @param {Process} process
     * @constructor
     */
    constructor(process) {

        super(process);

        this.model = process;

        const dRoot = dom('div');

        dRoot.addClass('process-view');

        dRoot.addClass(`editor-process-${process.name}`);

        this.$el = dRoot;
        this.el = dRoot.el;

        //add process name
        const lName = new LabelView(process.name);
        this.addChild(lName);

        this.bindSignal(process.state.onChanged, function (newValue, oldValue) {
            dRoot.removeClass(processState2ClassName(oldValue));
            dRoot.addClass(processState2ClassName(newValue));
        });
    }

    link() {
        const $el = this.$el;

        //clear status classes
        Object.values(ProcessState).map(processState2ClassName).forEach(function (state) {
            $el.removeClass(state);
        });

        //set active status class
        $el.addClass(processState2ClassName(this.model.state.getValue()));

        super.link();
    }
}


export default ProcessView;
