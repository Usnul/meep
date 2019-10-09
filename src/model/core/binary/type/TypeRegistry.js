/**
 * Created by Alex on 19/10/2016.
 */



function StructureRegistry() {
    this.types = {};
}

/**
 *
 * @param {Type} type
 * @param {Array.<String>} path
 * @private
 */
StructureRegistry.prototype.__add = function (type, path) {
    const name = type.name;

    if (this.types.hasOwnProperty(name)) {
        //type already exists, see if it's the same one
        if (this.types[name] === type) {
            //same scheme, nothing else to do
            return;
        } else {
            throw new Error(`A different scheme is already registered under name "${name}", path: /${path.join("/")}`);
        }
    }

    this.types[name] = type;

    //recurse over fields
    const fields = type.fields;
    for (let i = 0, l = fields.length; i < l; i++) {
        const field = fields[i];

        this.__add(field.type, path.concat(field.name + "::" + field.type.name));
    }
};

/**
 *
 * @param {Type} type
 */
StructureRegistry.prototype.add = function (type) {
    this.__add(type, []);
};

StructureRegistry.prototype.get = function (name) {
    return this.types[name];
};

export default StructureRegistry;
