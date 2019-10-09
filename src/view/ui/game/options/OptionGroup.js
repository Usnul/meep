import { Option } from "./Option.js";
import { stringify } from "../../../../model/core/json/JsonUtils.js";

function isOption(c) {
    return typeof c.read === "function";
}

/**
 *
 * @param {string} id
 * @constructor
 */
function OptionGroup(id) {
    this.id = id;

    /**
     *
     * @type {OptionGroup|null}
     */
    this.parent = null;

    /**
     *
     * @type {Array<OptionGroup|Option>}
     */
    this.children = [];
}

/**
 *
 * @param {string[]} path
 * @returns {OptionGroup|Option}
 * @throws when path could not be resolved
 */
OptionGroup.prototype.resolve = function (path) {
    let n = this;

    for (let i = 0; i < path.length; i++) {
        const id = path[i];
        n = n.children.find(c => c.id === id);

        if (n === undefined) {
            throw new Error(`Failed to resolve path at '${id}'[${i}], in path: [${path.join(', ')}]`);
        }
    }

    return n;
};

/**
 *
 * @param {Option|OptionGroup} el
 * @returns {boolean}
 */
OptionGroup.prototype.addChild = function (el) {
    if (this.getChildById(el.id) !== undefined) {
        console.error(`Option '${el.id}' already exists, new option is now added`);
        return false;
    }

    this.children.push(el);
    el.parent = this;

    return true;
};

/**
 *
 * @param {string} id
 * @returns {undefined|OptionGroup|Option}
 */
OptionGroup.prototype.getChildById = function (id) {
    return this.children.find(c => c.id === id);
};

/**
 *
 * @param id
 * @param read
 * @param write
 * @param settings
 * @returns {OptionGroup}
 */
OptionGroup.prototype.add = function (id, read, write, settings) {
    let option = new Option(id, read, write, settings);
    this.addChild(option);
    return this;
};

/**
 *
 * @param id
 * @returns {OptionGroup}
 */
OptionGroup.prototype.addGroup = function (id) {
    let group = new OptionGroup(id);
    this.addChild(group);
    return group;
};

OptionGroup.prototype.toJSON = function () {
    const result = {};
    this.children.forEach((c) => {
        if (c.isTransient) {
            //skip transient options
            return;
        }

        result[c.id] = c.toJSON();
    });

    return result;
};

OptionGroup.prototype.fromJSON = function (json) {
    this.children.forEach(c => {
        if (json.hasOwnProperty(c.id)) {
            c.fromJSON(json[c.id]);
        }
    });
};

/**
 *
 * @param {function} visitor
 */
OptionGroup.prototype.traverseOptions = function (visitor) {
    this.children.forEach(function (c) {
        if (isOption(c)) {
            visitor(c);
        } else {
            c.traverseOptions(visitor);
        }
    })
};

/**
 *
 * @param {string} path
 * @param {Storage} storage
 */
OptionGroup.prototype.attachToStorage = function (path, storage) {
    const group = this;

    const key = path;

    const p = new Promise(function (resolve, reject) {
        storage.load(key, resolve, reject);
    });

    p
        .then((loaded) => {
            try {
                group.fromJSON(JSON.parse(loaded));
            } catch (e) {
                console.log('Failed to load options')
            }
        })
        .catch(console.error)
        .finally(() => {

            group.traverseOptions(op => op.on.written.add(store));
        });


    function store() {
        const json = group.toJSON();

        const value = stringify(json);

        storage.store(key, value);
    }

};

OptionGroup.prototype.isOptionGroup = true;


export { OptionGroup };
