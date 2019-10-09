/**
 * User: Alex Goldring
 * Date: 8/4/2014
 * Time: 20:52
 */


/**
 *
 * @param {function|function[]} [options]
 * @constructor
 */
function Script(options) {
    if (options instanceof Array) {
        this.scripts = options;
    } else if (typeof options === "function") {
        this.scripts = [options];
    } else {
        this.scripts = [];
    }
}

Script.typeName = "Script";
Script.serializable = false;

export default Script;
