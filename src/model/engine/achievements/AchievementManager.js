import { GameAssetType } from "../asset/GameAssetType.js";
import { Achievement } from "./Achievement.js";
import { ReactiveAnd } from "../../core/model/reactive/model/logic/ReactiveAnd.js";
import { ReactiveReference } from "../../core/model/reactive/model/terminal/ReactiveReference.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import { AchievementNotificationView } from "../../../view/ui/game/achievements/AchievementNotificationView.js";
import ViewportPosition from "../ecs/gui/ViewportPosition.js";
import Vector2 from "../../core/geom/Vector2.js";
import EntityBuilder from "../ecs/EntityBuilder.js";
import GUIElement from "../ecs/gui/GUIElement.js";
import AnimationTrack from "../animation/keyed2/AnimationTrack.js";
import TransitionFunctions from "../animation/TransitionFunctions.js";
import { makeCubicCurve } from "../../core/math/MathUtils.js";
import { SequenceBehavior } from "../intelligence/behavior/composite/SequenceBehavior.js";
import { ActionBehavior } from "../intelligence/behavior/primitive/ActionBehavior.js";
import { AnimationBehavior } from "../../game/util/behavior/AnimationBehavior.js";
import AnimationTrackPlayback from "../animation/keyed2/AnimationTrackPlayback.js";
import { BehaviorComponent } from "../intelligence/behavior/ecs/BehaviorComponent.js";
import { SoundEmitter } from "../../sound/ecs/SoundEmitter.js";
import { SoundEmitterChannels } from "../../sound/ecs/SoundEmitterSystem.js";
import Transform from "../ecs/components/Transform.js";
import { SerializationMetadata } from "../ecs/components/SerializationMetadata.js";
import { globalMetrics } from "../metrics/GlobalMetrics.js";
import { MetricsCategory } from "../metrics/MetricsCategory.js";
import { ClockChannelType } from "../intelligence/behavior/ecs/ClockChannelType.js";


const SLOW_CUBIC = makeCubicCurve(0.04, 0.4, 0.9, 0.99);
const OVERSHOT_CUBIC_0 = makeCubicCurve(0.04, 0.4, 1.8, 0.99);

/**
 *
 * @param {String} id
 * @returns {string}
 */
function computeAchievementBlackboardFlag(id) {
    return `system.achievement.${id}.completed`;
}

export class AchievementManager {
    constructor() {
        /**
         *
         * @type {AchievementGateway|null}
         */
        this.gateway = null;

        /**
         *
         * @type {Achievement[]}
         */
        this.entries = [];


        /**
         *
         * @type {AssetManager|null}
         */
        this.assetManager = null;

        /**
         *
         * @type {Blackboard|null}
         */
        this.blackboard = null;

        /**
         *
         * @type {EntityManager|null}
         */
        this.entityManager = null;

        /**
         *
         * @type {Localization|null}
         */
        this.localization = null;

        /**
         * @readonly
         * @type {ObservedBoolean}
         */
        this.isStarted = new ObservedBoolean(false);


        /**
         * @readonly
         * @type {ObservedBoolean}
         */
        this.isGatewayInitialized = new ObservedBoolean(false);

        /**
         * @readonly
         * @type {ObservedBoolean}
         */
        this.isBlackboardAttached = new ObservedBoolean(false);

        /**
         * @readonly
         * @type {ReactiveAnd}
         */
        this.isActive = ReactiveAnd.from(
            ReactiveReference.from(this.isStarted, 'started'),
            ReactiveReference.from(this.isBlackboardAttached, 'blackboardAttached')
        );

        this.isActive.onChanged.add(v => {
            if (v) {
                this.activate();
            } else {
                this.deactivate();
            }
        });

        this.handlers = {};
    }

    /**
     *
     * @param {String} id
     * @return {Achievement|undefined}
     */
    getAchievementById(id) {
        return this.entries.find(a => a.id === id);
    }


    /**
     *
     * @param {String} id
     */
    unlock(id) {
        const key = computeAchievementBlackboardFlag(id);
        const value = this.blackboard.acquireBoolean(key, false);

        value.set(true);

        //release value
        this.blackboard.release(key);

        this.gateway.unlock(id);

        const achievement = this.getAchievementById(id);

        if (achievement !== undefined && this.isGatewayInitialized.getValue()) {
            this.deactivateEntry(achievement);

            this.present(achievement);
        }

        globalMetrics.record("achievement", {
            category: MetricsCategory.Progression,
            label: id
        });
    }

    /**
     * @private
     * @param {Achievement} entry
     */
    activateEntry(entry) {
        entry.trigger.link(this.blackboard);

        const handler = (v) => {
            if (v) {
                this.unlock(entry.id);
            }
        };


        this.handlers[entry.id] = handler;

        entry.trigger.getExpression()
            .process(handler);
    }

    /**
     * @private
     * @param {Achievement} entry
     */
    deactivateEntry(entry) {
        entry.trigger.unlink(this.blackboard);

        const handler = this.handlers[entry.id];

        if (handler !== undefined) {

            entry.trigger.getExpression()
                .onChanged.remove(handler);
        }
    }


    /**
     * @private
     */
    activate() {
        this.entries.forEach(a => {

            if (!a.enabled) {
                //ignore
                return;
            }

            this.activateEntry(a);
        });
    }

    /**
     * @private
     */
    deactivate() {

        this.entries.forEach(a => {
            this.deactivateEntry(a);
        });

    }

    /**
     *
     * @param {AssetManager} assetManager
     * @param {AchievementGateway} gateway
     * @param {Localization} localization
     * @param {EntityManager} entityManager
     */
    initialize({
                   assetManager,
                   gateway,
                   localization,
                   entityManager
               }) {

        this.assetManager = assetManager;
        this.gateway = gateway;
        this.entityManager = entityManager;
        this.localization = localization;
    }

    /**
     *
     * @param {AssetManager} assetManager
     */
    loadDefinitions(assetManager) {
        return new Promise((resolve, reject) => {
            assetManager.get(
                "data/database/achievements/data.json",
                GameAssetType.JSON,
                (asset) => {
                    try {

                        const json = asset.create();

                        json.forEach(def => {
                            const achievement = new Achievement();

                            achievement.fromJSON(def);

                            this.entries.push(achievement);
                        });

                    } catch (e) {

                        reject(e);

                        return;
                    }

                    resolve();

                }, reject);
        });
    }

    /**
     * Visually present an achievement
     * @param {Achievement} achievement
     */
    present(achievement) {
        const ecd = this.entityManager.dataset;

        if (ecd === null) {
            //no ECD, skip
            return;
        }

        const localization = this.localization;

        const achievementView = new AchievementNotificationView({ achievement, localization });

        achievementView.size.x = 460;
        achievementView.size.y = 58;

        const viewportPosition = new ViewportPosition({
            position: new Vector2(0.5, 0)
        });

        viewportPosition.anchor.set(0.5, 0.5);


        const aEntry = new AnimationTrack(['scale', 'alpha', 'v']);
        aEntry.addKey(0, [1.3, 0.2, 0]);
        aEntry.addKey(0.4, [1, 1, 0.8]);
        aEntry.addTransition(0, OVERSHOT_CUBIC_0);

        const aMain = new AnimationTrack(["value"]);
        aMain.addKey(0, [0]);
        aMain.addKey(5, [1]);
        aMain.addTransition(0, TransitionFunctions.Linear);

        const aExit = new AnimationTrack(['scale', 'alpha', 'v']);
        aExit.addKey(0, [1, 1, 0]);
        aExit.addKey(1, [1, 0, 1]);
        aExit.addTransition(0, SLOW_CUBIC);

        const builder = new EntityBuilder();

        const sequenceBehavior = SequenceBehavior.from([
            new AnimationBehavior(new AnimationTrackPlayback(aEntry, (scale, alpha, v) => {
                achievementView.scale.setScalar(scale);
                achievementView.css({
                    opacity: alpha
                });
            })),
            new AnimationBehavior(new AnimationTrackPlayback(aMain, (value) => {
            })),
            new AnimationBehavior(new AnimationTrackPlayback(aExit, (scale, alpha, v) => {
                achievementView.scale.setScalar(scale);
                achievementView.css({
                    opacity: alpha
                });
            })),
            new ActionBehavior(() => {
                builder.destroy();
            })
        ]);

        const cBehavior = new BehaviorComponent();
        //use system clock for behavior
        cBehavior.clock = ClockChannelType.System;
        cBehavior.list.push(sequenceBehavior);

        const guiElement = new GUIElement(achievementView);

        guiElement.group = "ui-managed-achievements";

        const soundEmitter = SoundEmitter.fromJSON({
            tracks: [
                {
                    url: "data/sounds/effects/Magic_Game_Essentials/Magic_Airy_Alert.wav",
                    startWhenReady: true
                }
            ],
            isPositioned: false,
            volume: 1,
            loop: false,
            channel: SoundEmitterChannels.Effects
        });

        //prevent achievement message from being serialized in game save

        builder
            .add(SerializationMetadata.Transient)
            .add(new Transform())
            .add(soundEmitter)
            .add(cBehavior)
            .add(guiElement)
            .add(viewportPosition)
            .build(ecd);
    }

    /**
     *
     * @param {Blackboard} blackboard
     */
    attachBlackboard(blackboard) {
        this.blackboard = blackboard;
        this.isBlackboardAttached.set(true);
    }

    async initializeGateway() {
        const unlockedIds = await this.gateway.getUnlocked();

        //de-activate unlocked achievements
        const unlockedAchievements = this.entries.filter(a => unlockedIds.includes(a.id));

        unlockedAchievements.forEach(a => a.enabled = false);


        //try to read unlocked achievements from blackboard
        if (this.isBlackboardAttached.getValue()) {

            this.entries.forEach(achievement => {
                const id = achievement.id;

                const blackboardKey = computeAchievementBlackboardFlag(id);

                const blackboardValue = this.blackboard.acquireBoolean(blackboardKey, false);

                if (!unlockedIds.includes(id)) {
                    // gateway doesn't have this achievement unlocked yet

                    // check blackboard

                    if (blackboardValue.getValue()) {
                        // unlocked in the blackboard, communicate to the gateway
                        this.gateway.unlock(id);

                        //disable achievement tracking
                        achievement.enabled = false;
                    }


                } else {

                    //not marker as unlocked on gateway
                    this.deactivateEntry(achievement);

                }

                //release the value
                this.blackboard.release(blackboardKey);
            });

        }

        this.isGatewayInitialized.set(true);

    }

    async startup() {
        //load achievement definitions
        await this.loadDefinitions(this.assetManager);

        this.initializeGateway();

        this.isStarted.set(true);
    }

    shutdown() {

    }
}
