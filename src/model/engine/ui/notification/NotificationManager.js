import NotificationLog from "../../notify/NotificationLog.js";
import { assert } from "../../../core/assert.js";
import { noop } from "../../../core/function/Functions.js";
import List from "../../../core/collection/List.js";
import EntityBuilder from "../../ecs/EntityBuilder.js";
import GUIElement from "../../ecs/gui/GUIElement.js";
import { SerializationMetadata } from "../../ecs/components/SerializationMetadata.js";


class LogDisplay {
    /**
     *
     * @param {NotificationLog} log
     * @param {function(log:NotificationLog)} initializer
     * @param {function(timeDelta:number)} [updateFunction]
     */
    constructor({
                    log,
                    initializer,
                    updateFunction = noop
                }) {

        this.needsUpdate = updateFunction !== noop;
        this.update = updateFunction;

        this.log = log;
        this.initializer = initializer;
    }

    initialize() {
        this.initializer(this.log);
    }
}

export class NotificationManager {
    constructor() {
        /**
         *
         * @type {Map<string, NotificationLog>}
         */
        this.channels = new Map();

        /**
         *
         * @type {List<LogDisplay>}
         */
        this.displays = new List();

        /**
         *
         * @type {string}
         * @private
         */
        this.defaultArea = undefined;

        /**
         *
         * @type {EntityManager|null}
         */
        this.entityManager = null;
    }

    /**
     *
     * @param {string} channel
     */
    createChannel(channel) {
        assert.typeOf(channel, 'string', 'channel');

        if (this.channels.has(channel)) {
            throw new Error(`channel '${channel}' already exists`);
        }

        this.channels.set(channel, new NotificationLog());

        if (this.defaultArea === undefined) {
            this.defaultArea = channel;
        }
    }

    /**
     *
     * @param {string} channel
     * @returns {NotificationLog|undefined}
     */
    getChannel(channel) {
        return this.channels.get(channel);
    }

    /**
     *
     * @param {string} channel
     * @param {function(log:NotificationLog):View} initializer
     * @param {function(timeDelta:number)} [updateFunction]
     */
    addDisplay(channel, initializer, updateFunction) {
        assert.typeOf(channel, 'string', 'channel');
        assert.typeOf(initializer, 'function', 'viewFactory');

        const log = this.channels.get(channel);

        if (log === undefined) {
            throw new Error(`channel '${channel}' doesn't exist`);
        }

        const display = new LogDisplay({ log, initializer, updateFunction });

        this.displays.add(display);

        display.initialize();
    }

    /**
     *
     * @param {string} channel
     * @param {ViewEmitter} viewEmitter
     * @param {String} [grouping]
     */
    addEmitterDisplay(channel, viewEmitter, grouping = null) {
        /**
         *
         * @type {Map<View, EntityBuilder>}
         */
        const views = new Map();

        const self = this;

        const managedNotificationChannelClass = `managed-notification-channel-${channel}`;

        function viewFactory(log) {

            viewEmitter.objectEmitter.objectFinalizer = function (view) {

                const entity = views.get(view);

                if (entity !== undefined) {
                    entity.destroy();
                }
            };

            log.elements.on.added.add(function (notification) {
                assert.notEqual(notification, null, 'notification is null');
                assert.notEqual(notification, undefined, 'notification is undefined');

                viewEmitter.spawn(notification);
            });

            viewEmitter.on.spanwed.add(function (view) {

                view.addClass(managedNotificationChannelClass);

                const eb = new EntityBuilder();

                //prevent serialization of the notification
                eb.add(SerializationMetadata.Transient);

                const em = self.entityManager;

                if (em !== null && em.dataset !== null) {
                    const guiElement = GUIElement.fromView(view);

                    guiElement.group = grouping;

                    eb.add(guiElement)
                        .build(em.dataset);

                    views.set(view, eb);
                }
            });

        }

        function updateFunction(tileDelta) {
            viewEmitter.tick(tileDelta);
        }

        this.addDisplay(channel, viewFactory, updateFunction);
    }

    /**
     *
     * @param {Notification} notification
     * @param {string} [areaId] uses default area when not specified
     */
    addNotification(notification, areaId = this.defaultArea) {
        assert.notEqual(notification, undefined, 'notification is undefined');
        assert.notEqual(notification, null, 'notification is null');

        const channel = this.channels.get(areaId);

        if (channel === undefined) {
            throw new Error(`Area '${areaId}' doesn't exist`);
        }

        channel.addNotification(notification);
    }

    /**
     *
     * @param {number} timeDelta
     */
    tick(timeDelta) {
        this.displays.forEach(display => {
            if (display.needsUpdate) {
                display.update(timeDelta);
            }
        });
    }
}
