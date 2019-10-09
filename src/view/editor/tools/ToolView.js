/**
 * Created by Alex on 16/01/2017.
 */


import View from "../../View";
import dom from "../../DOM";

import LabelView from '../../ui/common/LabelView';

class ToolView extends View {
    /**
     *
     * @param {Tool} tool
     * @constructor
     */
    constructor(tool) {

        super(tool);

        const dRoot = dom('div');

        dRoot.addClass('tool-view');

        dRoot.addClass(`editor-tool-${tool.name}`);

        this.el = dRoot.el;

        //add tool name
        const lName = new LabelView(tool.name);
        this.addChild(lName);
    }
}



export default ToolView;
