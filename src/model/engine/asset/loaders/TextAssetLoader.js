import xhr from "../xhr.js";

export function TextAssetLoader(path, callback, failure, progress) {
    // load the level
    xhr(path, function (data) {
        const asset = {
            create: function () {
                return data;
            }
        };
        callback(asset);
    }, failure);
}
