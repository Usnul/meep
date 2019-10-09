/**
 * Created by Alex on 01/11/2014.
 */


import Future from '../core/process/Future';

import Task from '../core/process/task/Task';
import TaskState from '../core/process/task/TaskState';
import TaskSignal from '../core/process/task/TaskSignal';
import { computeFileExtension } from "../core/FilePath.js";
import Level from "./Level.js";

const LevelEngine = function (assetManager, entityManager) {
    let level;

    Object.defineProperty(this, "level", {
        get: function () {
            return level;
        }
    });

    this.load = function (levelURL) {
        if (typeof levelURL !== "string") {
            throw new Error("Level URL must be a string");
        }

        let executor = null;

        const fileExtension = computeFileExtension(levelURL).toLocaleLowerCase();

        const fAsset = new Future(function (resolve, reject) {
            if (fileExtension === 'bin') {

                assetManager.get(levelURL, 'arraybuffer', function (buffer) {
                    const arrayBuffer = buffer.create();

                    const level = new Level(arrayBuffer, 'binary');
                    resolve(level);

                }, reject);

            } else if (fileExtension === 'json') {

                assetManager.get(levelURL, 'json', function (json) {

                    const levelJSON = json.create();
                    const level = new Level(levelJSON, 'json');

                    resolve(level);

                }, reject);

            } else {
                reject(`Unsupported level extension '${fileExtension}'`);
            }
        });

        let progressComputer = function () {
            return 0;
        };

        let cycleFunction;

        function loadLevelAsset() {
            fAsset.resolve();
            return TaskSignal.Yield;
        }

        cycleFunction = loadLevelAsset;

        const task = new Task({
            name: "Level Construction Task",
            cycleFunction: function () {
                return cycleFunction();
            },
            computeProgress: function () {
                return progressComputer();
            }
        });

        task.on.started.add(function (e) {
            executor = e;
        });

        /**
         *
         * @param {Level} level
         */
        function buildLevel(level) {

            const task = level.build(entityManager);
            const result = task;

            let fail = false;
            let failureReason = null;
            result.on.failed.addOne(function (reason) {
                fail = true;
                failureReason = reason;
            });

            progressComputer = result.computeProgress;

            cycleFunction = function () {
                if (fail) {
                    throw failureReason;
                }

                if (result.state.getValue() !== TaskState.SUCCEEDED) {
                    return TaskSignal.Yield;
                } else {
                    return TaskSignal.EndSuccess;
                }
            };

            if (executor === null) {
                console.error("LevelLoader: No executor bound");
            }

            executor.run(result);
        }

        fAsset.then(buildLevel, function (error) {
            cycleFunction = function () {
                console.error('Failed to load level asset', error);
                return TaskSignal.EndFailure;
            };
        });

        return {
            task,
            promise: fAsset
        };
    };

    this.unload = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
};
export default LevelEngine;
