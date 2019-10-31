/**
 * Created by Alex on 21/07/2015.
 */
import { EntityManager } from "../ecs/EntityManager.js";
import Scene from "./Scene.js";
import List from "../../core/collection/List.js";


/**
 *
 * @param {EntityManager} entityManager
 * @constructor
 */
function SceneManager(entityManager) {
    this.currentScene = null;
    /**
     * @type {List<Scene>}
     */
    this.scenes = new List();
    /**
     *
     * @type {EntityManager}
     */
    this.entityManager = entityManager;

    /**
     * Used to track scene transitions
     * @readonly
     * @private
     * @type {string[]}
     */
    this.stack = [];
}

/**
 *
 * @param {string} name
 * @returns {Scene}
 */
SceneManager.prototype.create = function (name) {
    const scene = new Scene(name);

    this.add(scene);

    return scene;
};

/**
 *
 * @param {Scene} scene
 */
SceneManager.prototype.add = function (scene) {
    if (this.exists(scene.name)) {
        throw new Error(`Scene named '${scene.name}' already exists`);
    }

    this.scenes.add(scene);
};

/**
 *
 * @param {string} name
 * @returns {number}
 */
SceneManager.prototype.indexByName = function (name) {
    const length = this.scenes.length;
    for (let i = 0; i < length; i++) {
        const scene = this.scenes.get(i);

        if (scene.name === name) {
            return i;
        }
    }

    return -1;
};

/**
 * @param {string} name
 * @returns {Scene|undefined}
 */
SceneManager.prototype.getByName = function (name) {
    return this.scenes.find(function (scene) {
        return scene.name === name;
    });
};

/**
 *
 * @param {string} name
 * @returns {boolean}
 */
SceneManager.prototype.remove = function (name) {
    const sceneIndex = this.indexByName(name);
    if (sceneIndex === -1) {
        //doesn't exist, no need to delete
        return false;
    }

    const scene = this.scenes.get(sceneIndex);


    if (this.currentScene === scene) {
        this.currentScene = null;
    }

    this.scenes.remove(sceneIndex);

    return true;
};

/**
 *
 * @returns {SceneManager}
 */
SceneManager.prototype.clear = function () {

    if (this.currentScene !== null) {
        this.currentScene.active.set(false);
        this.entityManager.detachDataSet();

        this.currentScene = null;
    }

    return this;
};

/**
 *
 * @param {string} name
 * @returns {boolean}
 */
SceneManager.prototype.exists = function (name) {
    return this.scenes.some(function (scene) {
        return scene.name === name;
    });
};

/**
 *
 * @param {string} name
 */
SceneManager.prototype.set = function (name) {
    const scene = this.getByName(name);

    if (scene === undefined) {
        throw new Error(`Scene named '${name}' doesn't exist, valid options are: [${this.scenes.map(s => s.name).join(', ')}]`);
    }

    if (this.currentScene === scene) {
        //already at that scene
        return;
    }

    const em = this.entityManager;

    if (this.currentScene !== null) {
        this.currentScene.active.set(false);
        this.entityManager.detachDataSet();
    }

    em.attachDataSet(scene.dataset);
    scene.active.set(true);

    this.currentScene = scene;
};

/**
 *
 * @param {string} id
 */
SceneManager.prototype.stackPush = function (id) {
    //take current scene and put it onto the stack
    this.stack.push(this.currentScene.name);

    this.set(id);
};

/**
 *
 * @returns {string} ID of the popped scene
 */
SceneManager.prototype.stackPop = function () {
    const id = this.stack.pop();

    this.set(id);

    return id;
};

/**
 * Clear out current stack of scenes
 */
SceneManager.prototype.stackDrop = function () {
    this.stack.splice(0, this.stack.length);
};

SceneManager.prototype.update = function (timeDelta) {

};

export default SceneManager;
