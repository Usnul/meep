import xhr from "../xhr.js";

export function JsonAssetLoader(path, callback, failure, progress) {
    // load the level
    xhr(path, function (data) {
        let object;
        try {
            object = JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse JSON " + path, e);
            console.error(data);

            failure(e);
            return;
        }

        const asset = {
            create: function () {
                return object;
            }
        };

        callback(asset);
    }, failure);
}
