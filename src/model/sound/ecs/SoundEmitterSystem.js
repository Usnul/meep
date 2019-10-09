/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 18:36
 */


import { System } from '../../engine/ecs/System';
import { SoundEmitter } from './SoundEmitter';
import Transform from '../../engine/ecs/components/Transform';
import { Asset } from "../../engine/asset/Asset.js";
import { SoundTrackNodes } from "./SoundTrackNodes.js";

/**
 * @readonly
 * @enum {string}
 */
export const SoundEmitterChannels = {
    Effects: 'effects',
    Music: 'music',
    Ambient: 'ambient'
};

export class SoundEmitterSystem extends System {
    /**
     *
     * @param {AssetManager} assetManager
     * @param {AudioNode} destinationNode
     * @param {AudioContext} context
     * @constructor
     * @property {AssetManager} assetManager
     */
    constructor(assetManager, destinationNode, context) {
        super();

        this.componentClass = SoundEmitter;

        this.dependencies = [Transform];

        //
        this.destinationNode = destinationNode;
        /**
         *
         * @type {AudioContext}
         */
        this.webAudioContext = context;
        this.assetManager = assetManager;

        this.channels = {};
        this.addChannel(SoundEmitterChannels.Effects)
            .addChannel(SoundEmitterChannels.Music)
            .addChannel(SoundEmitterChannels.Ambient);

        this.channels[SoundEmitterChannels.Effects].gain.setValueAtTime(1.2, 0);
        this.channels[SoundEmitterChannels.Music].gain.setValueAtTime(0.1, 0);

        assetManager.registerLoader("sound", function (path, success, failure, progress) {
            // Load a sound file using an ArrayBuffer XMLHttpRequest.
            const request = new XMLHttpRequest();

            request.open("GET", path, true);

            request.responseType = "arraybuffer";

            request.onload = function (e) {
                //decode works asynchronously, this is important to prevent lag in main thread
                context.decodeAudioData(request.response, function (buffer) {
                    const byteSize = e.total;

                    const asset = new Asset(function () {
                        return buffer;
                    }, byteSize);

                    success(asset);
                });
            };

            request.onerror = failure;

            request.onprogress = function (e) {
                //report progress
                progress(e.loaded, e.total);
            };

            request.send();
        });
    }

    /**
     *
     * @param {String} name
     * @returns {number}
     */
    getChannelVolume(name) {
        return this.channels[name].gain.value;
    }

    /**
     *
     * @param {String} name
     * @param {number} value
     */
    setChannelVolume(name, value) {
        this.channels[name].gain.setValueAtTime(value, 0);
    }

    addChannel(name) {
        const channels = this.channels;
        if (!channels.hasOwnProperty(name)) {
            const channel = channels[name] = this.webAudioContext.createGain();
            channel.connect(this.destinationNode);
        } else {
            console.error("Channel " + name + " already exists");
        }
        return this;
    }

    /**
     *
     * @param {String} name
     * @returns {boolean}
     */
    hasChannel(name) {
        return this.channels.hasOwnProperty(name);
    }

    /**
     *
     * @param {SoundEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     */
    link(emitter, transform, entity) {
        const context = this.webAudioContext;

        //what channel do we use?
        let channelName = emitter.channel;

        if (!this.hasChannel(channelName)) {
            console.error(`channel named '${channelName}' does not exist, defaulting to '${SoundEmitterChannels.Effects}'`);

            channelName = SoundEmitterChannels.Effects;

        }
        const targetNode = this.channels[channelName];


        const nodes = emitter.nodes;
        nodes.volume = context.createGain();
        if (emitter.isPositioned) {
            nodes.panner = context.createPanner();
            nodes.volume.connect(nodes.panner);
            nodes.panner.connect(targetNode);
            //
            nodes.panner.panningModel = 'HRTF';
            nodes.panner.rolloffFactor = emitter.distanceRolloff;
            nodes.panner.refDistance = emitter.distanceMin;
            nodes.panner.maxDistance = emitter.distanceMax;
        } else {
            nodes.volume.connect(targetNode);
        }

        const assetManager = this.assetManager;

        function addTrack(track) {
            registerTrack(context, assetManager, emitter, track);
        }

        emitter.tracks.forEach(addTrack);
        emitter.tracks.on.added.add(addTrack);
        emitter.tracks.on.removed.add(unregisterTrack);

        //volume
        nodes.volume.gain.setValueAtTime(emitter.volume.getValue(), 0);

        function updatePosition(x, y, z) {
            setEmitterPosition(emitter, x, y, z);
        }

        emitter.__data = {
            handleTrackAdded: addTrack,
            handlePositionChanged: updatePosition
        };

        transform.position.process(updatePosition);
    }

    /**
     *
     * @param {SoundEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     */
    unlink(emitter, transform, entity) {
        transform.position.onChanged.remove(emitter.__data.handlePositionChanged);

        const nodes = emitter.nodes;
        //stop all tracks
        emitter.tracks.forEach(function (track) {
            track.playing = false;
        });
        if (nodes.panner !== null) {
            //doesn't require destination
            nodes.panner.disconnect();
        } else if (nodes.volume !== null) {
            //doesn't require destination
            nodes.volume.disconnect();
        }

        const data = emitter.__data;

        emitter.tracks.on.added.remove(data.handleTrackAdded);
        emitter.tracks.on.removed.remove(unregisterTrack);
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const ecd = entityManager.dataset;

        /**
         *
         * @param {SoundTrack} track
         */
        function updateTrack(track) {
            if (track.playing) {
                track.time += timeDelta;
            }
        }

        /**
         *
         * @param {SoundEmitter} soundEmitter
         */
        function visitSoundEmitter(soundEmitter) {
            soundEmitter.tracks.forEach(updateTrack);
        }

        if (ecd !== null) {
            ecd.traverseComponents(SoundEmitter, visitSoundEmitter);
        }
    }
}


/**
 *
 * @param {SoundTrack} soundTrack
 */
function unregisterTrack(soundTrack) {
    soundTrack.nodes.volume.disconnect();
}

/**
 *
 * @param {AudioContext} context
 * @param {AssetManager} assetManager
 * @param {SoundEmitter} soundEmitter
 * @param {SoundTrack} soundTrack
 */
function registerTrack(context, assetManager, soundEmitter, soundTrack) {
    const targetNode = soundEmitter.nodes.volume;

    const nodes = soundTrack.nodes = new SoundTrackNodes(context);
    //connect to target
    nodes.volume.connect(targetNode);

    nodes.source.loop = soundTrack.loop;
    nodes.volume.gain.setValueAtTime(soundTrack.volume, 0);
    //
    assetManager.get(soundTrack.url, "sound", function (asset) {
        /**
         *
         * @type {AudioBuffer}
         */
        const buffer = asset.create();

        // Make the sound source use the buffer and start playing it.
        if (nodes.source.buffer !== buffer) {
            nodes.source.buffer = buffer;
        }

        if (soundTrack.startWhenReady) {
            //TODO: figure out a way to use AudioBuffer.playbackRate.value to control speed of playback
            nodes.source.start(0, soundTrack.time);
            soundTrack.playing = true;
        }

    }, function (error) {
        console.error(`failed to load sound track '${soundTrack.url}' : `, error);
    });

    nodes.source.onended = function () {
        if (!nodes.source.loop) {
            soundTrack.playing = false;
            soundTrack.on.ended.dispatch();
        }
    };
}


/**
 *
 * @param {SoundEmitter} emitter
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function setEmitterPosition(emitter, x, y, z) {
    const nodes = emitter.nodes;
    if (nodes.panner !== null) {
        const panner = nodes.panner;
        panner.setPosition(x, y, z);
    }
}
