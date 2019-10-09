/**
 * Created by Alex on 28/04/2016.
 */
import Animations from './Animations';
import ObservedValue from '../../core/model/ObservedValue';

/**
 *
 * @param {AnimationSpec.Type} type
 * @param {number} parameter
 * @param {number} duration in seconds
 * @param {function(x:number):number} transitionFunction
 * @constructor
 * @see {Tween} for more information on transition function
 */
const AnimationSpec = function (type, parameter, duration, transitionFunction) {
    this.parameter = parameter;
    this.duration = duration;
    this.transitionFunction = transitionFunction;
    this.type = type;

    this.tween = null;
};

AnimationSpec.Type = {
    TRANSLATE: 0,
    FADE: 1
};

/**
 *
 * @param {number} entity
 * @constructor
 * @property {Array.<AnimationSpec>} animationSpecs
 */
const EntityAnimation = function (entity) {
    this.entity = entity;
    this.animationSpecs = [];

    this.ended = new ObservedValue(false);
};

/**
 *
 * @returns {Promise<any>}
 */
EntityAnimation.prototype.promiseEnd = function () {
    return new Promise((resolve, reject) => {
        if (this.ended.getValue()) {
            resolve();
        } else {
            this.ended.onChanged.addOne(resolve);
        }
    })
};

EntityAnimation.prototype.__create = function (type, parameter, duration, transitionFunction) {
    this.animationSpecs.push(new AnimationSpec(type, parameter, duration, transitionFunction));
    return this;
};

EntityAnimation.prototype.translate = function (parameter, duration, timingFunction) {
    return this.__create(AnimationSpec.Type.TRANSLATE, parameter, duration, timingFunction);
};

EntityAnimation.prototype.fade = function (parameter, duration, timingFunction) {
    return this.__create(AnimationSpec.Type.FADE, parameter, duration, timingFunction);
};

/**
 *
 * @param {function(animation:EntityAnimation):void} callback
 * @returns {EntityAnimation}
 */
EntityAnimation.prototype.onEnded = function (callback) {
    const self = this;
    this.ended.onChanged.add(function (v) {
        if (v) {
            callback(self);
        }
    });

    return this;
};


EntityAnimation.prototype.start = function (em) {
    const entity = this.entity;
    const self = this;

    this.ended.set(false);

    function buildTranslation(spec, em) {
        spec.tween = Animations.translate(entity, em, spec.parameter, spec.duration, spec.transitionFunction);
    }

    function buildFade(spec, em) {
        spec.tween = Animations.fade(entity, em, spec.parameter, spec.duration, spec.transitionFunction);
    }

    this.animationSpecs.forEach(function (spec) {
        switch (spec.type) {
            case AnimationSpec.Type.TRANSLATE:
                buildTranslation(spec, em);
                break;
            case AnimationSpec.Type.FADE:
                buildFade(spec, em);
                break;
            default:
                console.error('Unknown animation type:', spec.type);
        }
    });
    let runningTweenCount = 0;

    function handleTweenEnded() {
        runningTweenCount--;
        if (runningTweenCount <= 0) {
            self.ended.set(true);
        }
    }

    //start all tweens
    this.animationSpecs.forEach(function (spec) {
        const tween = spec.tween;
        if (tween !== null) {
            runningTweenCount++;
            tween.on.ended.add(handleTweenEnded);
            tween.build(em);
        }
    });
};

export default EntityAnimation;

