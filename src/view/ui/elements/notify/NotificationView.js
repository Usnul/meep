/**
 * Created by Alex on 17/04/2016.
 */
import dom from '../../../DOM';
import View from "../../../View";
import { assert } from "../../../../model/core/assert.js";

class NotificationView extends View {
    /**
     *
     * @param {Notification} model
     * @param options
     * @constructor
     */
    constructor(model, options) {
        super(model, options);

        assert.notEqual(model, undefined, 'model is undefined');
        assert.notEqual(model, null, 'model is null');

        const dRoot = dom('div').addClass('ui-notification-view');
        const dImage = dRoot.createChild('img').addClass('image');
        const dTitle = dRoot.createChild('div').addClass('title');
        const dDescription = dRoot.createChild('div').addClass('description');

        model.classList.forEach(function (c) {
            dRoot.addClass(c);
        });

        function update() {
            const src = model.image.getValue();
            if (src === undefined || src === "") {
                dImage.css({ visibility: "hidden" });
            } else {
                dImage.attr({ src: src });
                dImage.css({ visibility: "visible" });
            }
            dTitle.text(model.title);
            dDescription.text(model.description);
        }

        this.el = dRoot.el;

        this.on.linked.add(update);

        this.bindSignal(model.image.onChanged, update);
    }
}


export default NotificationView;
