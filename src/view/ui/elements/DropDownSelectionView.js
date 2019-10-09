/**
 * Created by Alex on 21/03/2017.
 */


import View from '../../View';

class DropDownSelectionView extends View {
    constructor(model) {
        super();

        this.model = model;
        const elRoot = this.el = document.createElement('select');
        elRoot.classList.add('ui-drop-dow-selection-view');

        function addOne(el, index) {
            let element = document.createElement('option');
            element.setAttribute('value', el);
            element.innerText = el;

            elRoot.appendChild(element);
        }

        function removeOne(el) {
            let children = elRoot.children;
            let length = children.length;
            for (let i = 0; i < length; i++) {
                let child = children[i];
                if (child.value === el) {
                    elRoot.removeChild(child);
                    return;
                }
            }
        }

        this.handlers = {
            addOne,
            removeOne
        };

        this.bindSignal(this.model.on.added, this.handlers.addOne);
        this.bindSignal(this.model.on.removed, this.handlers.removeOne);
    }

    getSelectedValue() {
        return this.el.options[this.el.selectedIndex].value;
    }

    link() {
        super.link();

        this.removeAllChildren();

        this.model.forEach(this.handlers.addOne);
    }

    unlink() {
        super.unlink();
    }
}


export default DropDownSelectionView;
