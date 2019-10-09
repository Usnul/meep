import Vector2 from "../../../core/geom/Vector2";
import AnimationTrack from "../../animation/keyed2/AnimationTrack";
import { AnimatedObjectEmitter } from "./AnimatedObjectEmitter.js";


class ViewEmitter {
    /**
     *
     * @constructor
     */
    constructor() {
        this.source = new Vector2();

        this.objectEmitter = new AnimatedObjectEmitter();

        this.objectEmitter.objectInitializer = function (view) {
            view.visible = true;
        };

        const self = this;
        this.objectEmitter.objectFactory = function (opt) {
            const view = self.viewFactory(opt);
            view.position.copy(self.source);

            return view;
        };

        this.viewFactory = null;

        this.on = this.objectEmitter.on;
    }

    /**
     *
     * @param {AnimationTrack} animationTrack
     * @param {function} updater
     */
    setAnimation(animationTrack, updater) {
        this.objectEmitter.setAnimation(animationTrack, updater);
    }

    /**
     *
     * @param {number} v
     */
    setRushThreshold(v) {
        this.objectEmitter.rushThreshold = v;
    }

    tick(timeDelta) {
        this.objectEmitter.tick(timeDelta);
    }

    /**
     *
     * @param options
     */
    spawn(options) {
        return this.objectEmitter.spawn(options);
    }

    /**
     *
     * @param {View} view
     */
    remove(view) {
        return this.objectEmitter.remove(view);
    }
}

export default ViewEmitter;
