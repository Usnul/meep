/**
 * Created by Alex Goldring on 02/03/2015.
 */
import View from "../../View";

class GroupView extends View {
    constructor() {
        super();
        const el = this.el = document.createElement("div");
        el.classList.add("group");
        this.children = [];
    }

    add(view) {
        this.children.push(view);
        this.el.appendChild(view.el);
        return this;
    }

    remove(view) {
        const indexOf = this.children.indexOf(view);
        if (indexOf !== -1) {
            this.children.splice(indexOf, 1);
            this.el.removeChild(view.el);
        }
        return this;
    }

    update() {
        this.children.forEach(function (c) {
            c.update();
        });
    }
}


export default GroupView;
