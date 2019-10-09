/**
 * Created by Alex on 12/10/2015.
 */
import Script from "../ecs/components/Script";
import Signal from "../../core/events/signal/Signal.js";
import TransitionFunctions from "./TransitionFunctions";

/**
 *
 * @param {function(value:number, timeDelta:number)} callback
 * @param {number} valueStart
 * @param {number} valueEnd
 * @param {number} duration time in seconds
 * @param {function(fraction:number):number} [formula=TransitionFunctions.Linear]
 * @param {boolean} [oscillate=false]
 * @constructor
 */
const Tween = function (callback, valueStart, valueEnd, duration, formula, oscillate) {
    const self = this;

    this.valueStart = valueStart;
    this.valueEnd = valueEnd;
    this.timeElapsed = 0;
    this.oscillate = oscillate !== undefined ? oscillate : false;
    this.formula = typeof (formula) === "function" ? formula : TransitionFunctions.Linear;
    this.on = {
        ended: new Signal()
    };

    const valueRange = valueEnd - valueStart;
    this.script = new Script(function (timeDelta) {
        self.timeElapsed += timeDelta;
        const timeElapsed = self.timeElapsed;

        const cycleWhole = Math.floor(timeElapsed / duration);
        const cycleFraction = (timeElapsed % duration) / duration;
        let state = cycleFraction;
        if (self.oscillate) {
            if (cycleWhole % 2 === 1) {
                state = 1 - cycleFraction;
            }
        } else {
            if (cycleWhole > 0) {
                state = 1;
                self.on.ended.dispatch();
                //remove self
                self.destroy();
            }
        }
        const y = self.formula(state);
        const value = y * valueRange + valueStart;
        callback(value, timeDelta);
    });
};
Tween.prototype.destroy = function () {
    this.entityManager.removeEntity(this.entity);
};
Tween.prototype.build = function (em) {
    this.entityManager = em;
    this.entity = em.createEntity();
    em.addComponentToEntity(this.entity, this.script);
    return this.entity;
};


export default Tween;
