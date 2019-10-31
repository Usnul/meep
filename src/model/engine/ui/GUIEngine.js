/**
 * Created by Alex on 07/09/2016.
 */


import List from '../../core/collection/List';

import GUIElement from '../ecs/gui/GUIElement.js';
import ViewportPosition from '../ecs/gui/ViewportPosition.js';

import EntityBuilder from '../../engine/ecs/EntityBuilder';

import ConfirmationDialogView from '../../../view/ui/elements/ConfirmationDialogView';
import SimpleWindowView from '../../../view/ui/elements/SimpleWindow';

import View from '../../../view/View';
import TransitionFunctions from "../animation/TransitionFunctions";
import AnimationTrack from "../animation/keyed2/AnimationTrack";
import AnimationTrackPlayback from "../animation/keyed2/AnimationTrackPlayback";
import { playTrackRealTime } from "../animation/AnimationUtils.js";
import { TooltipManager } from "../../../view/ui/tooltip/TooltipManager";
import { DomTooltipManager } from "../../../view/ui/tooltip/DomTooltipManager.js";
import { NotificationManager } from "./notification/NotificationManager.js";
import ViewEmitter from "./notification/ViewEmitter.js";
import NotificationView from "../../../view/ui/elements/notify/NotificationView.js";
import Ticker from "../simulation/Ticker.js";
import { ModalStack } from "./modal/ModalStack.js";
import { SimpleLifecycle, SimpleLifecycleStateType } from "./modal/SimpleLifecycle.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import EmptyView from "../../../view/ui/elements/EmptyView.js";
import LinearModifier from "../../core/model/stat/LinearModifier.js";
import { GMLEngine } from "../../../view/ui/tooltip/GMLEngine.js";
import { assert } from "../../core/assert.js";
import ObservedString from "../../core/model/ObservedString.js";
import { CursorType } from "./cursor/CursorType.js";
import { noop } from "../../core/function/Functions.js";
import { SerializationMetadata } from "../ecs/components/SerializationMetadata.js";


/**
 * @readonly
 * @enum {string}
 */
export const NotificationAreaKind = {
    Primary: 'primary',
    Secondary: 'secondary',
    Toast: 'toast'
};

/**
 *
 * @param {NotificationManager} manager
 */
function initializeNotifications(manager) {
    function makePrimary() {
        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(1);

        const animationTrack = new AnimationTrack(["alpha", "scale"]);
        animationTrack.addKey(0, [0, 1.3]);
        animationTrack.addKey(0.6, [1, 1]);
        animationTrack.addKey(3.8, [1, 1]);
        animationTrack.addKey(4.3, [0, 1]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, scale) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.scale.set(scale, scale);
        });

        viewEmitter.viewFactory = function (options) {
            assert.notEqual(options, undefined, 'options is undefined');

            const notificationView = new NotificationView(options);

            return notificationView;
        };


        return viewEmitter;
    }

    function makeSecondary() {
        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(1);

        const animationTrack = new AnimationTrack(["alpha", "position.y", "scale"]);
        animationTrack.addKey(0, [0.2, 0, 1.1]);
        animationTrack.addKey(0.17, [1, 0, 1]);
        animationTrack.addKey(3, [1, -60, 1]);
        animationTrack.addKey(3.5, [0, -70, 1]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(1, TransitionFunctions.Linear);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, positionY, scale) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.position.setY(positionY);
            view.scale.set(scale, scale);
        });


        viewEmitter.viewFactory = function (options) {
            const notificationView = new NotificationView(options);

            return notificationView;
        };

        return viewEmitter;
    }


    function makeToast() {
        const displayDuration = 7;

        const viewEmitter = new ViewEmitter();
        viewEmitter.setRushThreshold(5);

        const animationTrack = new AnimationTrack(["alpha", "position.x"]);
        animationTrack.addKey(0, [0.2, 100]);
        animationTrack.addKey(0.17, [1, 0]);
        animationTrack.addKey(displayDuration, [1, 0]);
        animationTrack.addKey(displayDuration + 0.5, [0, 0]);

        animationTrack.addTransition(0, TransitionFunctions.EaseIn);
        animationTrack.addTransition(1, TransitionFunctions.Linear);
        animationTrack.addTransition(2, TransitionFunctions.EaseOut);

        viewEmitter.setAnimation(animationTrack, function (alpha, positionY) {
            /**
             * @type View
             */
            const view = this;

            view.el.style.opacity = alpha;
            view.position.setX(positionY);
        });


        viewEmitter.viewFactory = function (options) {
            const notificationView = new NotificationView(options);

            return notificationView;
        };

        return viewEmitter;
    }

    manager.createChannel(NotificationAreaKind.Primary);
    manager.createChannel(NotificationAreaKind.Secondary);
    manager.createChannel(NotificationAreaKind.Toast);

    manager.addEmitterDisplay(NotificationAreaKind.Primary, makePrimary());
    manager.addEmitterDisplay(NotificationAreaKind.Secondary, makeSecondary());
    manager.addEmitterDisplay(NotificationAreaKind.Toast, makeToast(), 'managed-toast-notifications');

    // testNotifications(manager);
}

function GUIEngine() {
    this.windows = new List();

    /**
     *
     * @type {EntityManager|null}
     */
    this.entityManager = null;

    this.modals = new ModalStack();

    /**
     *
     * @type {TooltipManager}
     */
    this.tooltips = new TooltipManager();

    /**
     *
     * @type {DomTooltipManager}
     */
    this.viewTooltips = new DomTooltipManager(this.tooltips);

    /**
     *
     * @type {NotificationManager}
     */
    this.notifications = new NotificationManager();

    initializeNotifications(this.notifications);


    /**
     *
     * @type {Ticker}
     */
    this.ticker = new Ticker();
    this.ticker.subscribe(d => this.notifications.tick(d));

    this.view = new EmptyView({ classList: ['gui-engine-root'] });

    /**
     *
     * @type {GMLEngine}
     */
    this.gml = new GMLEngine();

    /**
     *
     * @type {ObservedString}
     */
    this.cursor = new ObservedString(CursorType.Normal);


    /**
     *
     * @type {Localization|null}
     */
    this.localization = null;
}

/**
 * @param {boolean} closeable
 * @param {View} content
 * @param {string} title
 * @param {View} [wrapper]
 * @returns {EntityBuilder}
 */
GUIEngine.prototype.openWindow = function ({ closeable, content, title, wrapper }) {
    const entityBuilder = new EntityBuilder();

    function closeAction() {
        entityBuilder.destroy();
    }

    const windowView = new SimpleWindowView(content, {
        closeAction,
        title,
        closeable
    });

    entityBuilder.add(new ViewportPosition());

    let vElement;
    if (wrapper !== undefined) {
        vElement = wrapper;
        wrapper.addChild(windowView);
    } else {
        vElement = windowView;
    }

    const guiElement = new GUIElement(vElement);
    entityBuilder.add(guiElement)
        .add(SerializationMetadata.Transient);

    const dataset = this.entityManager.dataset;

    animateView(windowView, dataset);

    entityBuilder.build(dataset);

    return entityBuilder;
};

/**
 *
 * @param {View} view
 * @param {EntityComponentDataset} ecd
 */
function animateView(view, ecd) {

    const animationTrack = new AnimationTrack(["alpha", "scale"]);
    animationTrack.addKey(0, [0, 0.95]);
    animationTrack.addKey(0.2, [1, 1]);

    animationTrack.addTransition(0, TransitionFunctions.Linear);

    const playback = new AnimationTrackPlayback(animationTrack, function (alpha, scale) {
        this.el.style.opacity = alpha;
        this.scale.set(scale, scale);
    }, view);

    //force view status to initial key of animation
    playback.update();

    playTrackRealTime(playback, ecd);
}

/**
 *
 * @param {View} content
 * @param {string} title
 * @param {number} priority
 * @returns {SimpleLifecycle}
 */
GUIEngine.prototype.createModal = function ({ content, title, priority = 0 }) {
    const entityManager = this.entityManager;

    const self = this;
    let window = null;
    let overlay = null;


    function destroy() {
        window.destroy();
        overlay.destroy();
    }

    function makeOverlay() {
        const overlay = new View();
        overlay.el = document.createElement('div');
        overlay.el.classList.add('ui-modal-overlay');
        //make overlay dismiss modal
        overlay.el.addEventListener('click', function (event) {
            event.stopPropagation();
            lifecycle.makeDestroyed();
        });

        const builder = new EntityBuilder();

        builder.add(SerializationMetadata.Transient);
        builder.add(new GUIElement(overlay));
        return builder;
    }

    function build() {
        overlay = makeOverlay();

        overlay.build(entityManager.dataset);

        const view = content;

        const vModalContainer = new EmptyView({ classList: ['ui-modal-window-container'] });

        window = self.openWindow({
            title: title,
            content: view,
            closeable: false,
            wrapper: vModalContainer
        });

        const windowGuiElement = window.getComponent(GUIElement);
        windowGuiElement.anchor.set(0.5, 0.5);

        window.removeComponent(ViewportPosition);

    }

    const lifecycle = new SimpleLifecycle({ priority });

    lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Active, build);
    lifecycle.sm.addEventHandlerStateExit(SimpleLifecycleStateType.Active, destroy);

    this.modals.add(lifecycle);

    return lifecycle;
};

/**
 *
 * @param {string} title
 * @param {string} text
 * @param {View} content
 * @returns {Promise<any>}
 */
GUIEngine.prototype.createModalConfirmation = function ({ title, content }) {

    const self = this;

    let lifecycle = null;


    const result = new Promise(function (resolve, reject) {
        //make view

        let resolved = false;

        function clear() {
            lifecycle.makeDestroyed();
        }

        function callbackYes() {
            resolved = true;
            clear();
            resolve();
        }

        function callbackNo() {
            resolved = true;
            clear();
            reject();
        }

        const view = new ConfirmationDialogView(content,
            [{
                name: "yes",
                displayName: self.localization.getString("system_confirmation_confirm"),
                callback: callbackYes
            }, {
                name: "no",
                displayName: self.localization.getString("system_confirmation_cancel"),
                callback: callbackNo
            }]
        );

        lifecycle = self.createModal({
            content: view,
            title: title
        });

        lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Destroyed, function () {
            if (!resolved) {
                //if destroyed without resolution, reject the promise
                reject();
            }
        });
    });


    return result;
};


function createTextView(text) {
    const content = new View();
    content.el = document.createElement('div');
    content.el.classList.add('text');
    content.el.innerText = text;

    content.size.set(300, 100);
    return content;
}

/**
 * @param {string} text
 * @param {string} title
 * @returns {Promise} will be resolved or rejected based on user choice
 */
GUIEngine.prototype.confirmTextDialog = function ({ text, title }) {
    const content = createTextView(text);

    return this.createModalConfirmation({
        title,
        content: content
    });
};

/**
 *
 * @param {string} text
 * @param {string} title
 * @returns {Promise}
 */
GUIEngine.prototype.createTextAlert = function ({ text, title }) {
    const content = createTextView(text);
    return this.createAlert({
        content,
        title
    });
};

/**
 *
 * @param {View} content
 * @param {string} title
 * @param {number} priority
 * @param {function(SimpleLifecycle)} [lifecycleHook]
 * @returns {Promise}
 */
GUIEngine.prototype.createAlert = function ({ content, title, priority = 0, lifecycleHook = noop }) {
    /**
     *
     * @type {SimpleLifecycle|null}
     */
    let lifecycle = null;

    function clear() {
        lifecycle.makeDestroyed();
    }

    const localization = this.localization;

    const view = new ConfirmationDialogView(content,
        [{
            name: "ok",
            displayName: localization.getString("system_confirmation_continue"),
            callback: clear
        }]
    );

    lifecycle = this.createModal({
        content: view,
        title,
        priority
    });

    const result = new Promise(function (resolve, reject) {
        lifecycle.sm.addEventHandlerStateEntry(SimpleLifecycleStateType.Destroyed, resolve);
    });

    lifecycleHook(lifecycle);

    return result;
};

/**
 *
 * @param {Engine} engine
 */
GUIEngine.prototype.startup = function (engine) {
    this.entityManager = engine.entityManager;

    const self = this;

    /**
     *
     * @type {Localization}
     */
    const localization = engine.localization;

    this.gml.initialize(engine.staticKnowledge, localization);

    this.tooltips.initialize(this.gml, engine.devices.pointer);

    //attach tooltips to GML
    this.gml.tooltips = this.viewTooltips;

    this.view.addChild(this.tooltips.contextView);

    this.notifications.entityManager = engine.entityManager;


    engine.gameView.addChild(this.view);

    engine.gameView.size.process(function (x, y) {
        self.view.size.set(x, y);

        self.tooltips.contextView.size.set(x, y);
    });

    this.ticker.start();


    const clockModifier = new LinearModifier(0, 0);

    function stopSimulation() {

        //pause the clock
        engine.ticker.clock.speed.addModifier(clockModifier);

    }

    function resumeSimulation() {

        //restore game clock speed
        engine.ticker.clock.speed.removeModifier(clockModifier);

    }

    this.modals.on.firstAdded.add(stopSimulation);
    this.modals.on.lastRemoved.add(resumeSimulation);


    this.localization = localization;


    //register cursor propagation
    this.cursor.process(function (newValue, oldValue) {
        function className(cursorName) {
            return `cursor-${cursorName}`;
        }

        const classList = engine.graphics.domElement.classList;

        if (typeof oldValue === 'string') {
            classList.remove(className(oldValue));
        }

        if (typeof newValue === 'string') {
            classList.add(className(newValue));
        }
    });

    return Promise.all([
        this.tooltips.startup()
    ]);
};

GUIEngine.prototype.shutdown = function () {
    this.windows.reset();
    this.entityManager = null;

    const pTooltips = this.tooltips.shutdown();

    return Promise.all([
        pTooltips
    ]);
};

export default GUIEngine;
