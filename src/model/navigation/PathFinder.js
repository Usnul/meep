/**
 * Created by Alex on 03/02/14.
 */
import Vector3 from '../physics/Vector3';


/**
 * PathFinder uses a worker to allow asynchronous path finding, freeing up resources for rendering and game logic
 * @constructor
 */
const PathFinder = function (readyCallback) {
    const self = this;
    this.__pathTimout = 10000;
    const callbacks = this.callbacks = [];

    this.worker = new Worker("src/model/navigation/PathWorker.js");
    const api = {
        meshBuilt: function (options) {
            console.warn("mesh built");
            self.__pathTimout = 500;
        },
        pathFound: function (options) {
            const data = options.map(function (v) {
                return new Vector3(v.x, 0, v.y);
            });
            //remove first callback from the queue
            const callback = callbacks.shift();
            //invoke the callback
            if (callback) {
                callback(data);
            }
        },
        workerReady: function () {
            if (readyCallback !== void 0) {
                readyCallback();
            }
        }
    };
    const onmessage = function onmessage(event) {
        const data = event.data;
        const method = api[data.method];
        if (method) {
            method.call(api, data.options);
        } else {
            console.error("method '" + data.method + "' is not a supported");
        }
    };
    const onerror = function onerror(event) {
        console.error("PathFinder error: ", event);
        //bail all pending callbacks
        self.callbacks.forEach(function (callback) {
            callback(void 0);
        });
        self.callbacks = [];
        //restart the worker
        self.worker = new Worker("src/model/navigation/PathWorker.js");
        self.worker.onmessage = onmessage;
        self.worker.onerror = onerror;
        //bump up timeout until mesh is built
        self.__pathTimout = 2000;
        self.worker.postMessage({ method: "buildMesh", options: self.__buildMeshData });
    };
    this.worker.onmessage = onmessage;
    this.worker.onerror = onerror;

};
PathFinder.prototype.destroyMesh = function () {
    this.worker.postMessage({ method: "destroyMesh" });
};
/**
 * Construct navigation mesh
 * @param {Object} groundSize
 * @param {Walls} walls
 */
PathFinder.prototype.buildMesh = function (groundSize, walls) {
    // destroy old mesh
//        this.destroyMesh();

    function transformTo2D(vertex) {
        return { x: vertex.x, y: vertex.y };
    }

    const constrains = [];
//		walls.shapes.forEach(function (shape) {
//			constrains.push(shape.makeGeometry().vertices.map(function (vertex) {
//				return transformTo2D(vertex);
//			}));
//		});
    walls.paths.forEach(function (path) {
        if (path !== void 0) {
            const points = path.actions.map(function (item) {
                let type = item.action;
                const args = item.args;
                return { x: args[0], y: args[1] };
            });
            constrains.push(points);
        }
    });
    let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;
    constrains.forEach(function (polygon) {
        polygon.forEach(function (point) {
            minX = minX > point.x ? point.x : minX;
            minY = minY > point.y ? point.y : minY;
            maxX = maxX < point.x ? point.x : maxX;
            maxY = maxY < point.y ? point.y : maxY;
        });
    });
    const buffer = 20; // TODO Calculate the right world map boundary
    minX -= buffer;
    minY -= buffer;
    maxX += buffer;
    maxY += buffer;
    const boundary = [
        { x: minX, y: minY },
        { x: minX, y: maxY },
        { x: maxX, y: maxY },
        { x: maxX, y: minY }
    ];

    const data = this.__buildMeshData = { boundary: boundary, constrains: constrains };
    //bump up timeout until mesh is built
    this.__pathTimout = 2000;
    this.worker.postMessage({ method: "buildMesh", options: data });
//        Lct.init(data.boundary);
//        Lct.insertPolygons(data.constrains);
};

function vector3to2DJSON(v) {
    // return {x: v.x, y: v.y, z: v.z};
    return { x: v.x, y: v.z };
}

PathFinder.prototype.findPath = function (start, goal, clearance, callback) {
    //start timer so we can bail out if path is not found
    let timer;

    function wrappedCallback(arg) {
        clearTimeout(timer);
        callback(arg);
    }

    const callbacks = this.callbacks;
    callbacks.push(wrappedCallback);
    const options = {
        start: vector3to2DJSON(start),
        goal: vector3to2DJSON(goal),
        clearance: clearance
    };
    this.worker.postMessage({ method: "findPath", options: options });
    //start timer so we can bail out if path is not found
    timer = setTimeout(function bail() {
        const index = callbacks.indexOf(wrappedCallback);
        callbacks.splice(index, 1, function overdue() {
            //the response is overdue, but it has arrived. do nothing
        });
        //call callback with BadNews(tm)
        callback(void 0);
    }, this.__pathTimout);

//        var startTime = Date.now();
//        var path = Lct.getPath(options.start, options.goal, options.clearance);
//        var endTime = Date.now();
//        console.log("found path in " + (endTime - startTime) + "ms");
//        var data = path.vectors.map(function (v) {
//            return new Vector3(v.x, 0, v.y);
//        });
//        //invoke the callback
//        if (callback) {
//            callback(data);
//        }
};
export default PathFinder;
