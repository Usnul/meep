/**
 * Created by Alex on 07/03/2016.
 */
const DOM = function (argument, namespace) {
    let el;
    if (typeof argument === "string") {
        if (namespace === undefined) {
            el = document.createElement(argument);
        } else {
            el = document.createElementNS(namespace, argument);
        }
    } else if (typeof argument === "object") {
        el = argument;
    } else {
        el = document.createElement('div');
    }

    /**
     *
     * @type {Element}
     */
    this.el = el;
    return this;
};

/**
 *
 * @param {string} [elName=div]
 * @returns {DOM}
 */
DOM.prototype.createChild = function (elName) {
    const dom = new DOM(elName);
    this.append(dom);
    return dom;
};

function getPolymorphDOMElement(thing) {

    let el;
    if (thing instanceof DOM) {
        el = thing.el;
    } else {
        el = thing;
    }
    return el;
}

DOM.prototype.append = function (child) {
    const childEl = getPolymorphDOMElement(child);
    this.el.appendChild(childEl);
    return this;
};
DOM.prototype.remove = function (child) {
    const childEl = getPolymorphDOMElement(child);
    this.el.removeChild(childEl);
    return this;
};

DOM.prototype.text = function (text) {
    this.el.innerText = text;
    return this;
};

/**
 *
 * @param {string} querySelector
 * @returns {DOM|null}
 */
DOM.prototype.select = function (querySelector) {
    const el = this.el.querySelector(querySelector);

    if (el === null) {
        return null;
    } else {
        return domify(el);
    }
};

/**
 *
 * @param {string} name
 * @returns {DOM}
 */
DOM.prototype.addClass = function (name) {
    this.el.classList.add(name);
    return this;
};

DOM.prototype.removeClass = function (name) {
    this.el.classList.remove(name);
    return this;
};

/**
 *
 * @param {string} name
 * @param {boolean} flag
 * @returns {DOM}
 */
DOM.prototype.setClass = function (name, flag) {
    const classList = this.el.classList;
    classList.toggle(name, flag);
    return this;
};

DOM.prototype.css = function (hash) {
    for (let i in hash) {
        if (hash.hasOwnProperty(i)) {
            this.el.style[i] = hash[i];
        }
    }
    return this;
};

DOM.prototype.attr = function (hash) {
    const el = this.el;
    for (let i in hash) {
        if (hash.hasOwnProperty(i)) {
            el.setAttribute(i, hash[i]);
        }
    }
    return this;
};

DOM.prototype.clone = function () {
    return new DOM(this.el.cloneNode(true));
};

/**
 * removes all children
 * @returns {DOM}
 */
DOM.prototype.clear = function () {
    const el = this.el;
    while (el.children.length > 0) {
        el.removeChild(el.children[0]);
    }
    return this;
};

/**
 *
 * @param eventName
 * @param handler
 * @returns {DOM}
 */
DOM.prototype.on = function (eventName, handler) {
    const el = this.el;
    el.addEventListener(eventName, handler);
    return this;
};
/**
 *
 * @param eventName
 * @param handler
 * @returns {DOM}
 */
DOM.prototype.off = function (eventName, handler) {
    const el = this.el;
    el.removeEventListener(eventName, handler);
    return this;
};

/**
 *
 * @param {String|Element} [x=div]
 * @param {String} [namespace]
 * @returns {DOM}
 */
function domify(x, namespace) {
    return new DOM(x, namespace);
}

export default domify;