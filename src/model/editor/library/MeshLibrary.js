import List from "../../core/collection/List.js";


class MeshLibrary {

    constructor() {

        /**
         * @type {List.<string>}
         */
        this.assets = new List();
    }

    /**
     *
     * @param {string} url
     */
    add(url) {
        const existingAsset = this.assets.find(function (_url) {
            return _url === url;
        });

        if (existingAsset !== undefined) {
            //already exists
            return;
        }

        this.assets.add(url);
    }
}


export { MeshLibrary };