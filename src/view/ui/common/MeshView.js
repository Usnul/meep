/**
 * Created by Alex on 26/05/2016.
 */
import { makeModelView } from "../renderModel";

import Vector2 from "../../../model/core/geom/Vector2";
import AABB2 from "../../../model/core/geom/AABB2";

import View from "../../View";
import dom from "../../DOM";

class MeshView extends View {
    /**
     *
     * @param {ObservedValue} model
     * @param {{assetManager: AssetManager, size: Vector2, renderer: *}} options
     * @constructor
     */
    constructor(model, options) {

        const size = options.size instanceof Vector2 ?
            options.size :
            (typeof options.size === "object" ?
                    new Vector2().copy(options.size) :
                    new Vector2(50, 50)
            );

        super(model, options);
        this.model = model;

        const dRoot = dom('div').addClass('mesh-static-view');
        this.el = dRoot.el;

        this.dEl = dRoot;

        this.size.copy(size);

        this.focus = new AABB2(0, 0, 1, 1);

        if (options.focus !== undefined) {
            this.focus.copy(options.focus);
        }
        this.graphics = options.graphics;
        this.assetManager = options.assetManager;

        const self = this;

        this.handlers = {
            update: function () {
                self.update();
            }
        };

        this.renderedParams = {
            size: new Vector2(),
            focus: new AABB2()
        };
    }

    render() {
        const dEl = this.dEl;
        dEl.clear();

        const pModelView = makeModelView(this.model.get(), this.assetManager, this.size, this.graphics, this.focus);

        this.renderedParams.size.copy(this.size);
        this.renderedParams.focus.copy(this.focus);

        pModelView.then(function (el) {
            dEl.clear();
            dEl.append(el);
        });
    }

    update() {
        if (this.size.equals(this.renderedParams.size) && this.focus.equals(this.renderedParams.focus)) {
            //no change
        } else {
            this.render();
        }
    }

    link() {
        super.link();

        this.update();

        this.size.onChanged.add(this.handlers.update);
    }

    unlink() {
        super.unlink();

        this.size.onChanged.remove(this.handlers.update);
    }
}


export default MeshView;
