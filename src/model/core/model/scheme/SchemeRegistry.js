function SchemeRegistry() {
    this.types = {};
}

/**
 *
 * @param {Schema} scheme
 * @param {Array.<String>} path
 * @private
 */
SchemeRegistry.prototype.__add = function (scheme, path) {
    const name = scheme.name;

    if (this.types.hasOwnProperty(name)) {
        //type already exists, see if it's the same one
        if (this.types[name] === scheme) {
            //same scheme, nothing else to do
            return;
        } else {
            throw new Error(`A different scheme is already registered under name "${name}", path: /${path.join("/")}`);
        }
    }

    this.types[name] = scheme;

    //recurse over fields
    const fields = scheme.fields;
    for (let i = 0, l = fields.length; i < l; i++) {
        const field = fields[i];

        this.__add(field.type, path.concat(field.name + "::" + field.type.name));
    }
};

SchemeRegistry.prototype.add = function (scheme) {
    this.__add(scheme, []);
};

/**
 *
 * @param {string} name
 * @returns {Schema|null}
 */
SchemeRegistry.prototype.get = function (name) {
    const type = this.types[name];
    if (type === undefined) {
        return null;
    } else {
        return type;
    }
};

export default SchemeRegistry;