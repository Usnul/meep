importScripts('../../../lib/require.src', '../../../lib/three.src');

const onMessageActual = null;
const deferredMessages = [];

require(
    {
        baseUrl: ".",
        paths: {
            model: '../../model',
            lib: '../../../lib'
        }
    },
    [
        'lib/lct/lct-built'
    ],
    function (Lct) {

        const pathQueue = [];
        const initialized = false;
        const api = {
            destroyMesh: function (options) {
                Lct.reset();
                initialized = false;
            },
            buildMesh: function (initData) {
                Lct.init(initData.boundary);
                Lct.insertPolygons(initData.constrains);
                initialized = true;
                postMessage({ method: "meshBuilt" });
                //execute path finding for all deferred requests
                while (pathQueue.length > 0) {
                    const pathArgs = pathQueue.shift();
                    api.findPath(pathArgs);
                }
            },
            findPath: function (options) {
                if (!initialized) {
                    //queue up
                    pathQueue.push(options);
                    return;
                }
                const start = options.start;
                const goal = options.goal;
                const clearance = options.clearance;

                let startTime = Date.now();
                let path;
                path = Lct.getPath(start, goal, clearance);
                let endTime = Date.now();
//				console.log("found path[" + path.vectors.length + "] from " + JSON.stringify(start) + " to " + JSON.stringify(goal) + " of clearance " + clearance + " in " + (endTime - startTime) + "ms");
                postMessage({ method: "pathFound", options: path.vectors });
            }
        };
        onMessageActual = function (message) {
            const data = message.data;
            const method = api[data.method];
            if (method) {
                method.call(api, data.options);
            } else {
                console.error("method '" + data.method + "' is not a supported");
            }
        };
        console.log("path worker started");
        postMessage({ method: "workerReady", options: null });
        //handle deferred messages
        deferredMessages.forEach(onMessageActual);
    }
);

onmessage = function (message) {

    if (onMessageActual == null) {
        deferredMessages.push(message);
    } else {
        onMessageActual(message);
    }
};