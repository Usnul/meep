/**
 *
 */

import ConcurrentExecutor from '../core/process/executor/ConcurrentExecutor.js';

import { AssetManager } from './asset/AssetManager';
import InputEngine from '../InputEngine';
import { GraphicsEngine } from '../graphics/GraphicsEngine';
import SoundEngine from '../sound/SoundEngine';
import { PerspectiveCamera as ThreePerspectiveCamera, Scene as ThreeScene } from 'three';
import { PointerDevice } from "./input/devices/PointerDevice";
import KeyboardDevice from "./input/devices/KeyboardDevice";
import Grid from './grid/Grid';
import Preloader from "./asset/preloader/Preloader";
import SceneManager from "./scene/SceneManager";
import TaskProgressView from '../../view/ui/common/TaskProgressView';
import CompressionService from "./compression/CompressionService";

import GameStateLoader from './save/GameStateLoader';

import GUIEngine from './ui/GUIEngine';

import Editor from '../editor/Editor';

import dat from 'dat.gui'
import { EntityManager } from "./ecs/EntityManager";
import { initAssetManager } from "./asset/GameAssetManager";
import { AssetLoaderStatusView } from "../../view/ui/asset/AssetLoaderStatusView";
import ObservedBoolean from "../core/model/ObservedBoolean.js";
import Vector1 from "../core/geom/Vector1.js";
import { ViewStack } from "../../view/ui/elements/navigation/ViewStack.js";
import EmptyView from "../../view/ui/elements/EmptyView.js";
import { assert } from "../core/assert.js";
import Ticker from "./simulation/Ticker.js";
import { Localization } from "../core/Localization.js";
import { IndexedDBStorage } from "./save/storage/IndexedDBStorage.js";
import { globalMetrics } from "./metrics/GlobalMetrics.js";
import { MetricsCategory } from "./metrics/MetricsCategory.js";
import { AchievementManager } from "./achievements/AchievementManager.js";
import { StorageAchievementGateway } from "./achievements/gateway/StorageAchievementGateway.js";
import { ClassRegistry } from "../core/model/ClassRegistry.js";
import { BinarySerializationRegistry } from "./ecs/storage/binary/BinarySerializationRegistry.js";
import { OptionGroup } from "../../view/ui/game/options/OptionGroup.js";

//gui
const gui = new dat.GUI({
    autoPlace: false
});

function EngineSettings() {
    this.graphics_control_viewport_size = new ObservedBoolean(true);
    this.simulation_speed = new Vector1(1);
    this.input_mouse_sensitivity = new Vector1(5);
}

/**
 *
 * @constructor
 */
const Engine = function () {
  this.initialize();
  this.__datGui = gui;

  if (!window.ENV_PRODUCTION) {
    document.body.appendChild(gui.domElement);
  }

  gui.domElement.classList.add("ui-dev-menu");
};

function dat_makeFileField(callback) {
  const el = document.createElement("input");
  el.type = "file";
  el.style.visibility = "hidden";

  const result = {
    load: function () {
      el.click();
      el.onchange = function () {
        const files = el.files;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();
          reader.onload = function (e) {
            callback(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
    },
  };
  return result;
}

Engine.prototype.initialize = function () {
  /**
   *
   * @type {OptionGroup}
   */
  this.options = new OptionGroup();

  /**
   *
   * @type {ClassRegistry}
   */
  this.classRegistry = new ClassRegistry();

  this.settings = new EngineSettings();

  this.executor = new ConcurrentExecutor(0, 10);

  this.services = {
    compression: new CompressionService(),
  };

  /**
   *
   * @type {Storage}
   */
  this.storage = new IndexedDBStorage(
    "com.lazykitty.komrade.game.state",
    this.services
  );
  this.storage.compressionEnabled = false;

  /**
   *
   * @type {AssetManager}
   */
  this.assetManager = new AssetManager();
  initAssetManager(this.assetManager);

  this.localization = new Localization();
  this.localization.setAssetManager(this.assetManager);

  //setup entity component system
  const em = (this.entityManager = new EntityManager());

  /**
   * @readonly
   * @type {BinarySerializationRegistry}
   */
  this.serializationRegistry = new BinarySerializationRegistry();

  //renderer setup
  this.scene = new ThreeScene();
  //prevent automatic updates to all descendants of the scene, such updates are very wasteful
  this.scene.autoUpdate = false;
  //prevent scene matrix from automatically updating, as it would result in updates to the entire scene graph
  this.scene.matrixAutoUpdate = false;

  const innerWidth = window.innerWidth / 3;
  const innerHeight = window.innerHeight / 3;

  this.camera = new ThreePerspectiveCamera(45, innerWidth / innerHeight, 1, 50);

  /**
   *
   * @type {GraphicsEngine}
   */
  const ge = (this.graphics = new GraphicsEngine(this.camera, this.scene, em));

  try {
    ge.start();
  } catch (e) {
    console.log("Failed to start GraphicEngine: ", e);
  }

  this.inputEngine = new InputEngine(ge.domElement, window);

  //sound engine
  const soundEngine = new SoundEngine();
  soundEngine.volume = 1;

  /**
   *
   * @type {SoundEngine}
   */
  this.sound = soundEngine;

  /**
   * Graphical User Interface engine
   * @type {GUIEngine}
   */
  this.gui = new GUIEngine();

  this.achievements = new AchievementManager();
  this.achievements.initialize({
    assetManager: this.assetManager,
    gateway: new StorageAchievementGateway(this.storage),
    localization: this.localization,
    entityManager: this.entityManager,
  });

  this.sceneManager = new SceneManager(this.entityManager);
  this.ticker = new Ticker(em);
  this.ticker.subscribe((timeDelta) => this.entityManager.simulate(timeDelta));

  //
  this.grid = new Grid(this);

  this.devices = {
    pointer: new PointerDevice(window),
    keyboard: new KeyboardDevice(window),
  };
  this.initializeViews();

  this.devices.pointer.start();
  this.devices.keyboard.start();

  //process settings
  this.initializeSettings();

  console.log("engine initialized");

  this.gameStateLoader = new GameStateLoader(this);

  if (!window.ENV_PRODUCTION) {
    this.enableEditor();
  }
};

Engine.prototype.initializeViews = function () {

    const viewport = this.graphics.viewport;

    const gameView = new EmptyView();

    gameView.addClass('game-view');

    gameView.css({
        left: 0,
        top: 0,
        position: "absolute",
        pointerEvents: "none"
    });

    viewport.css({
        pointerEvents: "auto"
    });

    this.gameView = gameView;

    gameView.addChild(viewport);

    this.viewStack = new ViewStack();
    this.viewStack.push(gameView);

    //bind size of renderer viewport to game view
    viewport.bindSignal(gameView.size.onChanged, viewport.size.set.bind(viewport.size));
    gameView.on.linked.add(function () {
        viewport.size.copy(gameView.size);
    });
};

Engine.prototype.initializeSettings = function () {
    console.log('Initializing engine settings...');

    const engine = this;

    function setViewportToWindowSize() {
        engine.viewStack.size.set(window.innerWidth, window.innerHeight);
    }

    this.settings.graphics_control_viewport_size.process(function (value) {
        if (value) {
            setViewportToWindowSize();
            window.addEventListener("resize", setViewportToWindowSize, false);
        } else {
            window.removeEventListener("resize", setViewportToWindowSize);
        }
    });

    console.log('Engine settings initilized.');
};

Engine.prototype.benchmark = function () {
    const duration = 2000;
    let count = 0;
    const t0 = Date.now();
    let t1;
    while (true) {
        this.entityManager.simulate(0.0000000001);
        t1 = Date.now();
        if (t1 - t0 > duration) {
            break;
        }
        count++;
    }
    //normalize
    const elapsed = (t1 - t0) / 1000;
    const rate = (count / elapsed);
    return rate;
};

/**
 * Returns preloader object
 * @param {String} listURL
 */
Engine.prototype.loadAssetList = function (listURL) {
    const preloader = new Preloader();
    const assetManager = this.assetManager;
    assetManager.get(listURL, "json", function (asset) {
        preloader.addAll(asset.create());
        preloader.load(assetManager);
    });
    return preloader;
};

Engine.prototype.render = function () {
    if (this.graphics) {
        this.graphics.render();
    }
};

function printError(reason) {
    console.error.apply(console, arguments);
}

Engine.prototype.makeLoadingScreen = function (task) {
    const localization = this.localization;

    const taskProgressView = new TaskProgressView({ task, localization });
    taskProgressView.el.classList.add('loading-screen');

    //add asset manager loading progress
    const loaderStatusView = new AssetLoaderStatusView({ assetManager: this.assetManager, localization });
    taskProgressView.addChild(loaderStatusView);
    taskProgressView.link();

    const domParent = document.body;

    domParent.appendChild(taskProgressView.el);

    function cleanup() {
        domParent.removeChild(taskProgressView.el);
        taskProgressView.unlink();
    }

    task.join(cleanup, printError);
};

/**
 *
 * @param {Task|TaskGroup} task
 * @returns {Promise<any>}
 */
Engine.prototype.loadSlowTask = function (task) {
    assert.notEqual(task, undefined, 'task was undefined');
    assert.notEqual(task, null, 'task was null');

    const engine = this;

    return new Promise(function (resolve, reject) {

        function cleanup() {
            simulator.resume();
            //restore render layer visibility
            renderLayers.forEach((l) => l.layer.visible = l.state);
        }

        function success() {
            console.log("loaded level data");
            cleanup();
            resolve();
        }

        function failure(e) {
            printError(e);
            cleanup();
            reject();
        }

        //hide all render layers during load
        const renderLayers = engine.graphics.layers.map(function (layer) {
            return {
                layer,
                state: layer.visible
            }
        });

        renderLayers.forEach((l) => l.layer.visible = false);

        const simulator = engine.ticker;
        simulator.pause();

        task.join(success, failure);

        engine.makeLoadingScreen(task);
    });
};

Engine.prototype.enableEditor = function () {

    const self = this;
    let editor = null;


    let enabled = false;

    function attachEditor() {
        console.log('Enabling editor');
        if (editor === null) {
            editor = new Editor();
            editor.initialize();
        }
        editor.attach(self);
        enabled = true;
    }

    function detachEditor() {
        console.log('Disabling editor');
        if (editor !== null) {
            editor.detach();
        }
        enabled = false;
    }

    function toggleEditor() {
        if (!enabled) {
            attachEditor();
        } else {
            detachEditor();
        }
    }

    gui.add({ a: toggleEditor }, "a").name("Toggle Editor");

    //bind key for toggling editor
    this.inputEngine.mapKey(144, {
        on: function () {
            toggleEditor();
        },
        off: function () {

        }
    });

    console.warn('Editor mode enabled, use NumLock key to toggle editor mode');
};

/**
 * Startup
 * @returns {Promise}
 */
Engine.prototype.start = function () {
    const self = this;

    function promiseEntityManager() {
        return new Promise(function (resolve, reject) {
            //initialize entity manager
            self.entityManager.startup(resolve, reject);
        });
    }

    const pSoundStarted = this.sound.start()
        .then(promiseEntityManager);

    const pGuiStarted = this.gui.startup(this);
    const pAchievementsStarted = this.achievements.startup();

    return Promise.all([
        pSoundStarted,
        pGuiStarted,
        pAchievementsStarted
    ]).then(function () {
        let frameCount = 0;
        let renderTimeTotal = 0;

        function animate() {
            requestAnimationFrame(animate);
            frameCount++;
            const t0 = performance.now();
            self.render();
            const t1 = performance.now();
            renderTimeTotal += (t1 - t0) / 1000;
        }

        /**
         * Starting the engine
         */
        requestAnimationFrame(animate);
        const frameAccumulationTime = 20;
        setInterval(function () {
            const fpsCPU = frameCount / renderTimeTotal;
            const fpsGPU = frameCount / frameAccumulationTime;
            console.warn("FPS: " + fpsGPU + " [GPU] " + fpsCPU + " [CPU] ");

            //record metric
            const roundedFPS = Math.round(fpsGPU);

            if (roundedFPS > 0) {
                //only record values where FPS is non-zero
                globalMetrics.record("frame-rate", {
                    category: MetricsCategory.System,
                    label: roundedFPS.toString(),
                    value: roundedFPS
                });
            }

            frameCount = 0;
            renderTimeTotal = 0;
        }, frameAccumulationTime * 1000);
        //start simulation
        self.ticker.start({ maxTimeout: 200 });
        //self.uiController.init(self);

        //load options
        self.options.attachToStorage('lazykitty.komrade.options', self.storage);

        console.log("engine started");
    }, function (e) {
        console.error("Engine Failed to start.", e);
    });

};

Engine.prototype.exit = function () {
    window.close();
};

/**
 * @returns {Promise}
 */
Engine.prototype.requestExit = function () {
    return this.gui.confirmTextDialog({
        title: this.localization.getString('system_confirm_exit_to_system.title'),
        text: this.localization.getString('system_confirm_exit_to_system.text')
    }).then(() => {
        this.exit();
    });
};

export default Engine;
