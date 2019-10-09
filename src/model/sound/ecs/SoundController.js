/**
 * Created by Alex on 23/11/2016.
 */


import List from '../../core/collection/List';
import { BinaryClassSerializationAdapter } from "../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function Rule() {
    /**
     *
     * @type {Array<string>}
     */
    this.tracks = [];
    /**
     *
     * @type {String|null}
     */
    this.startEvent = null;
    /**
     *
     * @type {String|null}
     */
    this.stopEvent = null;
    /**
     *
     * @type {boolean}
     */
    this.loop = false;
    /**
     *
     * @type {number}
     */
    this.volume = 1;
    /**
     *
     * @type {String|null}
     */
    this.channel = null;
}

Rule.prototype.toJSON = function () {
    return {
        tracks: this.tracks,
        startEvent: this.startEvent,
        stopEvent: this.stopEvent,
        loop: this.loop,
        volume: this.volume,
        channel: this.channel
    };
};

Rule.prototype.fromJSON = function (json) {
    this.url = json.url;
    this.startEvent = json.startEvent;
    this.stopEvent = json.stopEvent;
    this.loop = json.loop;
    if (typeof json.volume === 'number') {
        this.volume = json.volume;
    } else {
        this.volume = 1;
    }

    if (json.tracks !== undefined) {
        this.tracks = json.tracks;
    } else {
        this.tracks = [];
    }


    //legacy "url" attribute
    if (typeof json.url === "string") {
        console.warn("deprecated 'url' attribute, use 'tracks' instead");
        this.tracks.push(json.url);
    }

    this.channel = json.channel;
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Rule.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.startEvent);
    buffer.writeUTF8String(this.stopEvent);

    const numTracks = this.tracks.length;
    buffer.writeUint8(numTracks);
    for (let i = 0; i < numTracks; i++) {
        const track = this.tracks[i];
        buffer.writeUTF8String(track);
    }

    buffer.writeUint8(this.loop ? 1 : 0);
    buffer.writeFloat64(this.volume);
    buffer.writeUTF8String(this.channel);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
Rule.prototype.fromBinaryBuffer = function (buffer) {
    this.startEvent = buffer.readUTF8String();
    this.stopEvent = buffer.readUTF8String();

    const numTracks = buffer.readUint8();
    this.tracks = [];
    for (let i = 0; i < numTracks; i++) {
        const track = buffer.readUTF8String();
        this.tracks[i] = track;
    }

    this.loop = buffer.readUint8() !== 0;
    this.volume = buffer.readFloat64();
    this.channel = buffer.readUTF8String();
};

/**
 *
 * @constructor
 * @property {List.<Rule>} rule
 */
function SoundController(options) {
    this.rules = new List();
    if (options !== undefined) {
        this.fromJSON(options);
    }
}

SoundController.Rule = Rule;

SoundController.typeName = "SoundController";

SoundController.prototype.fromJSON = function (json) {
    this.rules.fromJSON(json, Rule);
};

SoundController.prototype.toJSON = function () {
    return this.rules.toJSON();
};


export default SoundController;


export class SoundControllerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = SoundController;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundController} value
     */
    serialize(buffer, value) {
        value.rules.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {SoundController} value
     */
    deserialize(buffer, value) {
        value.rules.fromBinaryBuffer(buffer, Rule);
    }
}
