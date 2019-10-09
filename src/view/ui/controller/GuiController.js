/**
 * Created by Alex on 04/11/2016.
 */


import LabelView from '../common/LabelView';
import View from '../../View';
import dom from '../../DOM';


class RowView extends View {
    constructor(control, label) {
        super();

        const dRoot = dom();
        dRoot.addClass('gui-control-list-row');
        this.el = dRoot.el;


        const vLabel = new LabelView(label);

        this.addChild(vLabel);
        this.addChild(control);

        this.size.onChanged.add(function (x, y) {
            vLabel.position.setX(0);
        });
    }
}


class GuiController extends View {
    constructor() {
        super();

        const dRoot = dom();
        dRoot.addClass('gui-control-list');
        this.el = dRoot.el;

        this.rowSize = 23;

        this.rows = [];
        const self = this;
        this.size.onChanged.add(function (x, y) {
            self.rows.forEach(function (rowView) {
                rowView.size.setX(self.size.x);
            });
        });
    }

    /**
     *
     * @param {GuiControl} control
     * @param {string} label
     */
    addRow(control, label) {

        const rowView = new RowView(control, label);

        rowView.position.set(0, this.rows.length * this.rowSize);
        rowView.size.set(this.size.x, this.rowSize);

        this.rows.push(rowView);


        this.size.setY(this.rowSize * this.rows.length);

        this.addChild(rowView);
    }
}


export default GuiController;
