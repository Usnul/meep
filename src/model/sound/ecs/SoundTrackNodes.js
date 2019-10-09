export class SoundTrackNodes {
    /**
     *
     * @param {AudioContext} context
     */
    constructor(context) {
        /**
         *
         * @type {AudioBufferSourceNode}
         */
        this.source = context.createBufferSource();
        /**
         *
         * @type {GainNode}
         */
        this.volume = context.createGain();
        //connect volume to source
        this.source.connect(this.volume);
    }
}