import AssetLevel from "./AssetLevel";
import Signal from "../../../core/events/signal/Signal.js";

class AssetLoadSpec {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.uri = null;
        /**
         *
         * @type {String}
         */
        this.type = null;
        /**
         *
         * @type {number|AssetLevel}
         */
        this.level = AssetLevel.OPTIONAL;
        /**
         *
         * @type {number}
         */
        this.priotity = 0;
    }

    fromJSON({ uri, type, level = AssetLevel.OPTIONAL, priority = 0 }) {
        this.uri = uri;
        this.type = type;
        this.level = level;
        this.priotity = priority;
    }

    /**
     *
     * @param data
     * @return {AssetLoadSpec}
     */
    static fromJSON(data) {
        const r = new AssetLoadSpec();

        r.fromJSON(data);

        return r;
    }
}

const Preloader = function () {
    this.totalAssetCount = 0;
    //
    const assets = this.assets = [];
    //build batch containers for each level
    for (let l in AssetLevel) {
        if (AssetLevel.hasOwnProperty(l)) {
            const level = AssetLevel[l];
            assets[level] = [];
        }
    }
    //setup signals
    this.on = {
        added: new Signal(),
        progress: new Signal(),
        levelFinished: new Signal(),
        error: new Signal(),
        loadStart: new Signal(),
        completed: new Signal()
    };
};
Preloader.prototype.add = function (uri, type, level, priority) {
    if (level === void 0) {
        level = AssetLevel.OPTIONAL;
    }
    const assets = this.assets;
    //asset definition
    const def = AssetLoadSpec.fromJSON({
        uri,
        type,
        priority
    });

    if (!assets.hasOwnProperty(level)) {
        //unsupported level was requested, defaulting to optional
        level = AssetLevel.OPTIONAL;
        console.warn(`Unsupported level(=${level}) was requested for ${JSON.stringify(def)}, defaulting to optional`);
    }
    assets[level].push(def);
    this.totalAssetCount++;
    this.on.added.dispatch(def, level);
    return this;
};

Preloader.prototype.addAll = function (list) {
    const self = this;
    list.forEach(function (el) {
        self.add(el.uri, el.type, el.level);
    });
};

Preloader.prototype.load = function (assetManager) {
    const on = this.on;
    //current level being processed
    const assets = this.assets;
    //dispatch init event
    const initEvent = assets.map(function (batch, level) {
        return {
            level: level,
            count: batch.length
        };
    });
    on.loadStart.dispatch(initEvent);
    const numAssets = this.totalAssetCount;
    let numAssetsLoaded = 0;

    //submit requests in batches in order of importance
    function loadBatch(level) {
        //filter out assets of specified level
        const batch = assets[level];
        const batchElementCount = batch.length;
        if (batchElementCount === 0) {
            //batch of 0 elements
            //dispatch completion event
            on.levelFinished.dispatch(level);
            //early exit
            return;
        }
        let batchElementLoadedCount = 0;

        function assetLoadSuccess(asset) {
            batchElementLoadedCount++;
            numAssetsLoaded++;
            let ratio = numAssetsLoaded / numAssets;
            //dispatch progress
            on.progress.dispatch({
                level: {
                    id: level,
                    value: batchElementLoadedCount,
                    max: batchElementCount
                },
                global: {
                    value: numAssetsLoaded,
                    max: numAssets
                }
            });
            //monitor completion
            if (batchElementLoadedCount >= batchElementCount) {
                on.levelFinished.dispatch(level);
            }
        }

        function assetLoadFailed(e) {
            on.error.dispatch(e);
        }

        //sort batch by priority
        batch.sort((a, b) => {
            return b.priotity - a.priority;
        });

        batch.forEach(function (def) {
            assetManager.get(def.uri, def.type, assetLoadSuccess, assetLoadFailed);
        });
    }

    const levels = [];
    for (let level in assets) {
        if (assets.hasOwnProperty(level)) {
            levels.push(level);
        }
    }
    let lastLoadedLevel = 0;

    function f() {
        if (lastLoadedLevel < levels.length) {
            const levelToLoad = lastLoadedLevel;
            lastLoadedLevel++;
            on.levelFinished.addOne(f);
            // console.log("requesting load of level ",levelToLoad);
            loadBatch(levelToLoad);
        } else {
            on.completed.dispatch();
        }
    }

    f();

    return this;
};
export default Preloader;
