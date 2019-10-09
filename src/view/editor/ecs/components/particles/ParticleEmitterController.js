import GuiControl from "../../../../ui/controller/controls/GuiControl.js";
import DatGuiController from "../DatGuiController.js";
import { BlendingType } from "../../../../../model/graphics/texture/sampler/BlendingType.js";
import { ParticleLayer } from "../../../../../model/graphics/particles/particular/engine/emitter/ParticleLayer.js";
import ListController from "../../../../ui/controller/controls/ListController.js";
import ParticleLayerController from "./ParticleLayerController.js";
import { ParticleEmitterFlag } from "../../../../../model/graphics/particles/particular/engine/emitter/ParticleEmitterFlag.js";


/**
 *
 * @param {*} value
 * @param {Object} enumerable
 * @returns {string}
 */
export function enumNameByValue(value, enumerable) {
    return Object.keys(enumerable)[Object.values(enumerable).indexOf(value)];
}

/**
 *
 * @param {ParticleEmitter} emitter
 * @param {ParticleEmitterSystem2} system
 */
function applyEmitterChanges(emitter, system) {
    const particleEngine = system.particleEngine;

    //re-add the emitter
    particleEngine.remove(emitter);

    //update internal state
    emitter.build();
    emitter.initialize();
    emitter.registerLayerParameters();
    emitter.computeBaseBoundingBox();
    emitter.computeBoundingBox();

    particleEngine.add(emitter);
}

export class ParticleEmitterController extends GuiControl {
    /**
     *
     * @param {ParticleEmitterSystem2} particleEmitterSystem
     * @constructor
     */
    constructor(particleEmitterSystem) {
        super();

        const self = this;

        const emitterSurrogate = {
            preWarm: false,
            depthRead: true,
            depthSoft: true,
            blendingMode: Object.keys(BlendingType)[0],
            update: function () {
                applyChanges();
            },
            dump: function () {
                console.log(JSON.stringify(self.model.toJSON(), 3, 3));
            }
        };


        this.vDat = new DatGuiController();

        const dat = this.vDat;


        const cPreWarm = dat.addControl(emitterSurrogate, 'preWarm').onChange(function (value) {
            const emitter = self.model.getValue();

            /**
             * @type {ParticleEmitter}
             */
            emitter.writeFlag(ParticleEmitterFlag.PreWarm, value);

            applyChanges();
        });

        const cDepthRead = dat.addControl(emitterSurrogate, 'depthRead').onChange(function (value) {
            const emitter = self.model.getValue();

            /**
             * @type {ParticleEmitter}
             */
            emitter.writeFlag(ParticleEmitterFlag.DepthReadDisabled, !value);

            applyChanges();
        });

        const cDepthSoft = dat.addControl(emitterSurrogate, 'depthSoft').onChange(function (value) {
            const emitter = self.model.getValue();

            /**
             * @type {ParticleEmitter}
             */
            emitter.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, !value);

            applyChanges();
        });

        const cBlendingMode = dat.addControl(emitterSurrogate, 'blendingMode', Object.keys(BlendingType)).onChange(function (blendModeName) {
            self.model.getValue().blendingMode = BlendingType[blendModeName];
            applyChanges();
        });

        //layers
        const cLayers = new ListController(
            function () {
                return new ParticleLayer();
            },
            function () {
                return new ParticleLayerController();
            }
        );

        dat.addControl(emitterSurrogate, 'update').name('Apply Changes');
        dat.addControl(emitterSurrogate, 'dump').name('Dump JSON');

        this.addChild(this.vDat);
        this.addChild(cLayers);


        function applyChanges() {
            const emitter = self.model.getValue();

            if (emitter !== null) {
                applyEmitterChanges(emitter, particleEmitterSystem);
            }
        }

        const signalBindings = [];

        /**
         *
         * @param {ParticleEmitter} emitter
         * @param oldEmitter
         */
        function modelSet(emitter, oldEmitter) {
            if (oldEmitter !== null) {

                signalBindings.forEach(b => b.unlink());
                signalBindings.splice(0, signalBindings.length);

                cLayers.model.set(null);
            }

            if (emitter !== null) {
                emitterSurrogate.preWarm = emitter.getFlag(ParticleEmitterFlag.PreWarm);
                emitterSurrogate.depthRead = !emitter.getFlag(ParticleEmitterFlag.DepthReadDisabled);
                emitterSurrogate.depthSoft = !emitter.getFlag(ParticleEmitterFlag.DepthSoftDisabled);

                emitterSurrogate.blendingMode = enumNameByValue(emitter.blendingMode, BlendingType);

                cPreWarm.setValue(emitterSurrogate.preWarm);
                cDepthRead.setValue(emitterSurrogate.depthRead);
                cDepthSoft.setValue(emitterSurrogate.depthSoft);
                cBlendingMode.setValue(emitterSurrogate.blendingMode);

                cLayers.model.set(emitter.layers);

            }
        }

        this.model.onChanged.add(modelSet);
    }
}
