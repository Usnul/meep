/**
 *
 * @enum {number}
 */
export const ParticleEmitterFlag = {
    /**
     * Emitters that are asleep are not being simulated
     */
    Sleeping: 1,
    /**
     * Emitting emitters are allowed to produce new particles
     */
    Emitting: 2,
    /**
     * Internal flag, triggers sprite update in the emitter shader
     */
    SpritesNeedUpdate: 4,
    /**
     * When enabled emitter will start with pre-emitted particles
     */
    PreWarm: 8,

    /**
     * Emitter needs to be initialized before simulation can start proper
     */
    Initialized: 16,

    /**
     * Before emitter can be used it must be built first
     */
    Built: 32,

    /**
     * Position has changed since last update
     */
    PositionChanged: 64,

    /**
     * Whether particles should be sorted by depth or not
     */
    DepthSorting: 128,
    /**
     * Base bounds of particle layers require re-computation
     */
    BaseBoundsNeedUpdate: 256,

    /**
     * Hash value of the emitter is dirty and needs to be re-calculated
     */
    HashNeedUpdate: 512,

    DepthReadDisabled: 1024,

    DepthSoftDisabled: 2048,
};
