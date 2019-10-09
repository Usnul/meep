/**
 * @author Alex Goldring
 * @copyright Alex Goldring 11/6/2014
 */


/**
 *
 * @constructor
 */
function SoundEngine() {

    // Fix up prefixing
    let AudioContext = (
        window.AudioContext ||
        window.webkitAudioContext ||
        null
    );

    if (!AudioContext) {
        throw new Error("AudioContext not supported!");
    }

    // Create a new audio context.
    const context = this.context = new AudioContext({
        /*
         * The type of playback that the context will be used for, as a value from the AudioContextLatencyCategory enum or a double-precision floating-point value indicating the preferred maximum latency of the context in seconds. The user agent may or may not choose to meet this request; check the value of AudioContext.baseLatency to determine the true latency after creating the context.
         *
         * Values:
         *
         * "balanced"	    The user agent should balance audio output latency and power consumption when selecting a latency value.
         * "interactive"	The audio is involved in interactive elements, such as responding to user actions or needing to coincide with visual cues such as a video or game action. The user agent should select the lowest possible latency that doesn't cause glitches in the audio. This is likely to require increased power consumption. This is the default value.
         * "playback"	    The user agent should select a latency that will maximize playback time by minimizing power consumption at the expense of latency. Useful for non-interactive playback, such as playing music.
         */
        latencyHint: 'interactive'
    });

    //start suspended to keep chrome satisfied, otherwise it prints a warning
    context.suspend();

    // master volume
    const gainNode = context.createGain();

    // Dynamic compressor makes quiet sounds louder and loud quieter
    const compressor = context.createDynamicsCompressor();
    this.destination = gainNode;
    gainNode.connect(compressor);
    compressor.connect(context.destination);

    // master channel
    Object.defineProperties(this, {
        volume: {
            get: function () {
                return gainNode.gain.value;
            },
            set: function (val) {
                gainNode.gain.setValueAtTime(val, context.currentTime, 0);
            }
        }
    });
}

/**
 * Audio context needs to be resumed as it is created in suspended state by default
 * @see https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
 * @returns {Promise<void>}
 */
SoundEngine.prototype.resumeContext = function () {
    const pResumed = this.context.resume();

    return pResumed;
};

/**
 *
 * @returns {Promise<any>}
 */
SoundEngine.prototype.start = function () {

    return new Promise((resolve, reject) => {
        //don't want for context to be resumed
        this.resumeContext();

        resolve();
    });
};

export default SoundEngine;
