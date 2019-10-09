/**
 * Created by Alex on 04/11/2016.
 */


import View from "../../../View";
import dat from 'dat.gui'
import { OptionGroup } from "./OptionGroup.js";
import { SoundEmitter } from "../../../../model/sound/ecs/SoundEmitter.js";
import { SoundEmitterChannels } from "../../../../model/sound/ecs/SoundEmitterSystem.js";

/**
 * Set track.time=0 on SoundEmitters in Music channel
 * @param {EntityComponentDataset} ecd
 */
export function resetMusicTracks(ecd) {

    /**
     *
     * @param {SoundEmitter} soundEmitter
     * @param entity
     */
    function visitSoundEmitter(soundEmitter, entity) {
        if (soundEmitter.channel === SoundEmitterChannels.Music) {
            soundEmitter.tracks.forEach(t => {
                //reset time
                t.time = 0;
            });
        }
    }

    ecd.traverseComponents(SoundEmitter, visitSoundEmitter);
}

/**
 * DAT.GUI sets styles directly on the element internally, to prevent this - we use this hack that clears styles every frame while view is visible
 * @param {View} view
 */
function clearGUIStyles(view) {

    let clearStyleFlag = false;

    function clearStyle() {
        view.el.removeAttribute('style');
    }

    function runClearStyle() {
        clearStyle();

        if (clearStyleFlag) {
            requestAnimationFrame(runClearStyle);
        }
    }

    view.on.linked.add(function () {
        clearStyleFlag = true;

        runClearStyle();
    });

    view.on.unlinked.add(function () {
        clearStyleFlag = false;
    });
}

class OptionsView extends View {
    /**
     *
     * @constructor
     * @param {OptionGroup} options
     * @param {Localization} localization
     */
    constructor({ options, localization }) {
        super(options, localization);

        const gui = new dat.GUI({
            autoPlace: false,
            resizable: false,
            closed: false
        });

        /**
         *
         * @param {Option|OptionGroup} option
         * @returns {String[]}
         */
        function getPathFor(option) {
            const result = [option.id];

            let thing = option.parent;

            while (thing !== null) {
                result.push(thing.id);
                thing = thing.parent;
            }

            result.reverse();

            return result;
        }

        /**
         *
         * @param {Option|OptionGroup} option
         */
        function getNameFor(option) {
            const pathString = getPathFor(option).join('.');

            const localizationKey = 'system_option.' + pathString;

            return localization.getString(localizationKey);
        }

        const controls = new Map();

        function updateLocalization() {
            controls.forEach((control, option) => {
                const optionName = getNameFor(option);
                if (option.isOptionGroup) {
                    control.name = optionName;
                } else {
                    control.name(optionName);
                }
            });
        }

        this.on.linked.add(updateLocalization);
        this.bindSignal(localization.locale.onChanged, updateLocalization);


        const self = this;

        /**
         *
         * @param {Option} option
         * @param rootFolder
         */
        function makeOption(option, rootFolder) {
            const op = {
                v: null
            };

            let control;

            Object.defineProperty(op, "v", {
                get: function () {
                    return option.read();
                },
                set: function (v) {
                    return option.write(v);
                }
            });

            try {
                control = rootFolder.add(op, "v", option.settings.values);
            } catch (e) {
                console.error("Failed to add option controller", option, e);
                return;
            }

            if (typeof option.settings.min === "number") {
                control = control.min(option.settings.min);
            }
            if (typeof option.settings.max === "number") {
                control = control.max(option.settings.max);
            }

            control.name(getNameFor(option));

            controls.set(option, control);

            self.bindSignal(option.on.written, (v) => {
                control.updateDisplay();
            });
        }

        function makeGroup(group, rootFolder) {
            function isOption(c) {
                return typeof c.read === "function";
            }

            group.children.forEach((c) => {
                if (isOption(c)) {
                    makeOption(c, rootFolder);
                } else {
                    const folder = rootFolder.addFolder(c.id);

                    folder.name = getNameFor(c);

                    controls.set(c, folder);

                    makeGroup(c, folder);
                }
            });
        }

        makeGroup(options, gui);


        this.el = gui.domElement;

        clearGUIStyles(this);


        //update all controls on linkage
        this.on.linked.add(() => {
            controls.forEach(control => control.updateDisplay());
        }, this);
    }
}


export default OptionsView;
