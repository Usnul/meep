/**
 * Created by Alex on 17/04/2016.
 */
import dom from '../../../DOM';

import View from "../../../View";
import NotificationView from './NotificationView';

function fadeIn(view, delay, callback) {
    const dView = dom(view.el);
    view.position.setX(200);
    setTimeout(function () {
        dView.css({
            transition: "all " + delay + "s ease-in"
        });
        view.position.setX(0);
    }, 0);
    setTimeout(callback, delay * 1000);
}

function fadeOut(view, delay, callback) {
    const dView = dom(view.el);
    dView.css({
        opacity: 1
    });
    setTimeout(function () {
        dView.css({
            transition: "opacity " + delay + "s ease-in",
            opacity: 0
        });
    }, 0);
    setTimeout(callback, delay * 1000);
}

class ToastLogView extends View {
    /**
     *
     * @param {NotificationLog} model
     * @param options
     * @constructor
     */
    constructor(model, options = { displayDuration: 5 }) {
        super(model, options);

        const dRoot = dom('div').addClass("ui-toast-log-view");
        let dContainer = dRoot.createChild('div').addClass('notification-container');

        this.el = dRoot.el;
        const self = this;
        this.children = [];

        const displayDuration = options.displayDuration;

        function updatePositions() {

            const children = self.children;
            const numChildren = children.length;
            const maxIndex = numChildren - 1;

            const ITEM_HEIGHT = 24;

            children.forEach(function (view, index) {
                view.position.set(view.position.x, -(maxIndex - index) * ITEM_HEIGHT);
            });
        }

        function removeChildView(view) {
            dRoot.remove(view.el);
            const i = self.children.indexOf(view);
            self.children.splice(i, 1);

            updatePositions();
        }

        function addOne(notification) {
            const childView = new NotificationView(notification);

            self.addChild(childView);

            self.children.push(childView);

            fadeIn(childView, 0.2, function () {
                setTimeout(function () {
                    fadeOut(childView, 1, function () {
                        removeChildView(childView);
                    })
                }, displayDuration * 1000);
            });

            updatePositions();
        }

        model.elements.on.added.add(addOne);
    }
}



export default ToastLogView;
