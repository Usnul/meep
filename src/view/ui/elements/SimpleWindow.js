/**
 * Created by Alex on 16/03/2016.
 */
import View from "../../View";
import dom from "../../DOM";
import { PointerDevice } from '../../../model/engine/input/devices/PointerDevice';
import ObservedValue from '../../../model/core/model/ObservedValue';

import ObservedValueView from '../common/LabelView';
import { DraggableAspect } from "../../../model/engine/ui/DraggableAspect.js";
import { MouseEvents } from "../../../model/engine/input/devices/events/MouseEvents.js";

const borderWidth = 10;
const titleBarWidth = 44;

/**
 *
 * @param {View} view
 * @param {Element} domElement
 */
function makeDraggable(view, domElement) {
    let origin = null;
    const draggableAspect = new DraggableAspect({
        el: domElement,
        drag(position, anchor) {

            const delta = position.clone().sub(anchor);
            view.position.copy(origin.clone().add(delta));
        },
        dragStart() {
            origin = view.position.clone();

        }
    });

    draggableAspect.start();

}

function makeCloseable(view, closeAction) {

    const elCloseButton = document.createElement("div");
    elCloseButton.classList.add("button-close");
    view.el.appendChild(elCloseButton);

    const elCloseButtonIcon = document.createElement("div");
    elCloseButtonIcon.classList.add("icon");
    elCloseButton.appendChild(elCloseButtonIcon);

    elCloseButton.addEventListener(MouseEvents.Click, closeAction);
}

function makeResizable(view) {
    const globalPointerDevice = new PointerDevice(window);
    const pointerDevice = new PointerDevice(view.el);

    pointerDevice.start();

    let anchor = null;

    globalPointerDevice.on.move.add(function (position) {
        const delta = position.clone().sub(anchor);
        view.size.add(delta);
    });

    globalPointerDevice.on.up.add(function () {
        globalPointerDevice.stop();
    });

    pointerDevice.on.down.add(function (position) {
        const p = view.size.clone().sub(position.clone().sub(view.position));
        if (p.x < 10 && p.x > 0 && p.y < 10 && p.y > 0) {

            anchor = position.clone();
            globalPointerDevice.start();

        }
    });
}

class SimpleWindowView extends View {
    constructor(contentView, options) {
        super(contentView, options);

        const dRoot = dom("div").addClass("ui-element-window");
        this.el = dRoot.el;

        contentView.addClass("content");

        this.addChild(contentView);

        const closeAction = options.closeAction;

        if (options.closeable !== false && typeof closeAction === "function") {
            makeCloseable(this, closeAction);
        }


        this.title = new ObservedValue(options.title);

        const lTitle = new ObservedValueView(this.title, {
            classList: ['title']
        });

        this.addChild(lTitle);

        if (options.draggable) {
            makeDraggable(this, lTitle.el);
        }

        if (options.resizable) {
            makeResizable(this);
        }

        this.content = contentView;
    }
}


export default SimpleWindowView;
