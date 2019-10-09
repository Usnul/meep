/**
 * Created by Alex on 27/02/2017.
 */

import View from "../../../View";
import dom from "../../../DOM";

class ImageView extends View {
    /**
     *
     * @param {String|ObservedString} url
     * @param {String[]} classList
     */
    constructor(url, { classList = [] } = {}) {
        super();

        const dRoot = dom('img');

        classList.forEach((c) => dRoot.addClass(c));

        function setSource(url) {
            try {
                dRoot.attr({ 'src': url });
            } catch (e) {
                console.error("Failed to set source attribute url:", url, e);
            }
        }

        if (typeof url === "string") {
            setSource(url);
        } else if (typeof url === "object" && typeof url.getValue === "function") {
            setSource(url.getValue());

            if (url.onChanged !== undefined) {
                this.bindSignal(url.onChanged, setSource);
            }
        }

        this.size.onChanged.add(function (x, y) {
            dRoot.attr({
                'width': x,
                'height': y
            });
        });

        this.el = dRoot.el;
    }
}


export default ImageView;
