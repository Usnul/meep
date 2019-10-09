import Vector3 from "../../../../model/core/geom/Vector3";
import List from "../../../../model/core/collection/List";
import Vector2 from "../../../../model/core/geom/Vector2";
import ObservedValue from "../../../../model/core/model/ObservedValue";
import EmptyView from "../../elements/EmptyView";
import Vector1 from "../../../../model/core/geom/Vector1";

import dat from "dat.gui";
import Signal from "../../../../model/core/events/signal/Signal.js";
import ObservedBoolean from "../../../../model/core/model/ObservedBoolean";
import ObservedEnum from "../../../../model/core/model/ObservedEnum";
import ObservedString from "../../../../model/core/model/ObservedString.js";
import { isTypedArray } from "../../../../model/core/json/JsonUtils.js";
import { Color } from "../../../../model/core/color/Color.js";
import View from "../../../View.js";
import ObservedInteger from "../../../../model/core/model/ObservedInteger.js";

/**
 *
 * @param {object} model
 * @param {function(model, gui)} mutationVisitor called whenever model changes
 * @return {View}
 */
function datify(model, mutationVisitor) {
    const emptyView = new EmptyView();
    emptyView.model = new ObservedValue(model);

    const gui = new dat.GUI({
        autoPlace: false,
        closed: false,
        closeOnTop: false, //If true, close/open button shows on top of the GUI
        resizable: false
    });
    emptyView.el = gui.domElement;

    function build(model) {
        clear(gui);

        const rowCount = makeDatControllerForObject(gui, model);

        if (mutationVisitor !== undefined) {
            mutationVisitor(model, gui);
        }
    }

    emptyView.model.onChanged.add(build);

    build(model);


    return emptyView;
}

function nukeFolders(gui) {
    const folders = gui.__folders;
    for (let folderName in folders) {
        const folder = folders[folderName];

        const domElement = folder.domElement;
        const containerEl = gui.__ul;
        const children = containerEl.children;

        delete gui.__folders[folderName];

        for (let i = children.length - 1; i >= 0; i--) {
            const element = children.item(i);
            if (domElement.parentNode === element) {
                //trash
                try {
                    containerEl.removeChild(element);
                } catch (e) {
                }
            }
        }
    }
}

function clear(gui) {

    //remove existing controllers
    gui.__controllers.slice().forEach(function (controller) {
        try {
            gui.remove(controller);
        } catch (e) {
        }
    });

    nukeFolders(gui);
}

function ObjectPathElement(parent, propertyName) {
    this.parent = parent;
    this.propertyName = propertyName;
}

ObjectPathElement.prototype.sameValue = function (value) {
    return this.parent[this.propertyName] === value;
};

function ObjectPath() {
    this.elements = [];
}

ObjectPath.prototype.containsValue = function (v) {
    return this.elements.some(function (el) {
        return el.sameValue(v);
    });
};

/**
 *
 * @param {ObjectPath} other
 */
ObjectPath.prototype.copy = function (other) {
    this.elements = other.elements.slice();
};

/**
 *
 * @returns {ObjectPath}
 */
ObjectPath.prototype.clone = function () {
    const clone = new ObjectPath();

    clone.copy(this);

    return clone;
};

ObjectPath.prototype.add = function (object, propertyName) {
    const el = new ObjectPathElement(object, propertyName);
    this.elements.push(el);
};

ObjectPath.prototype.prettyPrintPath = function () {
    return "/" + this.elements.map(el => el.propertyName).join("/");
};

function makeDatControllerForObject(folder, value, path = new ObjectPath()) {
    let result = 0;
    let exclude = [];

    if (value instanceof Vector3) {
        makeControllerVector3(folder, value);

        exclude.push("x", "y", "z");

        result += 3;
    } else if (value instanceof Vector2) {
        makeControllerVector2(folder, value);

        exclude.push("x", "y");

        result += 2;
    } else if (value instanceof Vector1) {
        makeControllerVector1(folder, value);

        exclude.push("x");

        result += 1;
    } else if (
        value instanceof ObservedValue
        || value instanceof ObservedBoolean
        || value instanceof ObservedString
        || value instanceof ObservedInteger
    ) {
        makeControllerObservedValue(folder, value, "value");

        result += 1;
    } else if (value instanceof Color) {
        makeControllerColor(folder, value, 'value');

        result += 1;
    }


    for (let p in value) {
        if (p.startsWith("_")) {
            //private field convention, skip
            continue;
        } else if (exclude.indexOf(p) !== -1) {
            //field is excluded
            continue;
        }

        const childValue = value[p];

        if (childValue === undefined) {
            //skip undefined fields, DAT throws error for these
            continue;
        }

        if (typeof childValue === "object" && path.containsValue(childValue)) {
            console.warn(`Detected cycle at "${p}" in path : ${path.prettyPrintPath()}, skipping property`);
            continue;
        }

        result += makeDatController(folder, value, p, path.clone());
    }
    return result;
}

function makeControllerVector3(folder, value) {
    const proxy = { x: 0, y: 0, z: 0 };
    Object.defineProperties(proxy,
        {
            x: {
                get: function () {
                    return value.x;
                },
                set: function (v) {
                    value.setX(v);
                }
            },
            y: {
                get: function () {
                    return value.y;
                },
                set: function (v) {
                    value.setY(v);
                }
            },
            z: {
                get: function () {
                    return value.z;
                },
                set: function (v) {
                    value.setZ(v);
                }
            }
        }
    );
    folder.add(proxy, "x");
    folder.add(proxy, "y");
    folder.add(proxy, "z");
}

function makeControllerVector2(folder, value) {
    const proxy = { x: 0, y: 0 };
    Object.defineProperties(proxy,
        {
            x: {
                get: function () {
                    return value.x;
                },
                set: function (v) {
                    value.setX(v);
                }
            },
            y: {
                get: function () {
                    return value.y;
                },
                set: function (v) {
                    value.setY(v);
                }
            }
        }
    );
    folder.add(proxy, "x");
    folder.add(proxy, "y");
}

function makeControllerVector1(folder, value) {
    const proxy = { x: 0 };
    Object.defineProperties(proxy,
        {
            x: {
                get: function () {
                    return value.x;
                },
                set: function (v) {
                    value.setX(v);
                }
            }
        }
    );
    folder.add(proxy, "x");
}


/**
 *
 * @param {dat.gui.GUI} folder
 * @param {Color} value
 * @param {string} propertyName
 */
function makeControllerColor(folder, value, propertyName) {
    const proxy = { v: null };
    Object.defineProperties(proxy,
        {
            v: {
                get: function () {
                    return value.toUint();
                },
                set: function (v) {
                    value.fromUint(v);
                }
            },
        }
    );

    folder.addColor(proxy, "v").name(propertyName);
}

/**
 *
 * @param {dat.gui.GUI} folder
 * @param {ObservedValue} value
 * @param {String} propertyName
 */
function makeControllerObservedValue(folder, value, propertyName) {
    const proxy = { v: null };
    Object.defineProperties(proxy,
        {
            v: {
                get: function () {
                    return value.getValue();
                },
                set: function (v) {
                    value.set(v);
                }
            },
        }
    );
    folder.add(proxy, "v").name(propertyName);
}

/**
 *
 * @param {dat.gui.GUI} folder
 * @param {ObservedEnum} value
 * @param {String} propertyName
 */
function makeControllerObservedEnum(folder, value, propertyName) {
    const validSet = value.__validSet;
    const keys = Object.keys(validSet);

    const proxy = { v: null };
    Object.defineProperties(proxy,
        {
            v: {
                get: function () {
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        if (validSet[key] === value.getValue()) {
                            return keys[i];
                        }
                    }

                    return null;
                },
                set: function (v) {
                    const setValue = validSet[v];
                    value.set(setValue);
                }
            },
        }
    );
    folder.add(proxy, "v", keys).name(propertyName);
}

/**
 *
 * @param {dat.GUI} datFolder
 * @param {object} parent
 * @param {String} propertyName
 * @param {ObjectPath} path
 * @returns {number} number of added rows
 */
function makeDatController(datFolder, parent, propertyName, path = new ObjectPath()) {
    let result = 0;

    const value = parent[propertyName];

    if (typeof value === "object") {
        if (path.containsValue(value)) {
            //entering a cycle
            console.warn(`Detected cycle at "${p}" in path : ${path.prettyPrintPath()}, ignoring property`);
            return 0;
        } else {
            path.add(parent, propertyName);
        }
    }


    if (!parent.hasOwnProperty(propertyName)) {
        //not a directly owned property, skip
    } else if (value instanceof Vector3) {
        const folder = datFolder.addFolder(propertyName);
        makeControllerVector3(folder, value);

        result += 4;
    } else if (value instanceof Vector2) {
        const folder = datFolder.addFolder(propertyName);
        makeControllerVector2(folder, value);

        result += 3;
    } else if (value instanceof Vector1) {
        const proxy = { v: 0 };
        Object.defineProperties(proxy,
            {
                v: {
                    get: function () {
                        return value.getValue();
                    },
                    set: function (v) {
                        value.set(v);
                    }
                },
            }
        );
        datFolder.add(proxy, "v").name(propertyName);

        result += 1;
    } else if (value instanceof ObservedEnum) {
        makeControllerObservedEnum(datFolder, value, propertyName);
        result += 1;
    } else if (value instanceof ObservedValue || value instanceof ObservedBoolean) {
        makeControllerObservedValue(datFolder, value, propertyName);

        result += 1;
    } else if (value instanceof Color) {
        makeControllerColor(datFolder, value, propertyName);

        result += 1;
    } else if (value instanceof List) {
        //don't display
    } else if (value instanceof Signal) {
        //don't display
    } else if (value instanceof Array) {
        //don't display
    } else if (isTypedArray(value)) {
        //don't display
    } else if (value instanceof Promise) {
        //don't display
    } else if (value instanceof View) {
        //don't display
    } else if (typeof value === "object") {
        const folder = datFolder.addFolder(propertyName);
        result += 1;
        result += makeDatControllerForObject(folder, value, path);
    } else {
        datFolder.add(parent, propertyName);
        result += 1;
    }

    return result;
}

export { datify, clear, makeDatController };
