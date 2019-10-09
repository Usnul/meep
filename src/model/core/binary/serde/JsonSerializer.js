import SchemeRegistry from "../../model/scheme/SchemeRegistry";
import LineBuilder from "../../codegen/LineBuilder";

function JsonSerializer(registry = new SchemeRegistry()) {
    this.registry = registry;
    this.serializers = {};
}

/**
 *
 * @param value
 * @param {Type} type
 * @param {Map} visitedObjects
 * @private
 */
JsonSerializer.prototype.__serialize = function (value, type, visitedObjects) {
    const existing = visitedObjects.get(value);
    if (existing !== undefined) {
        //cycle detected
        return existing;
    }

    const serializer = this.getSerializer(typeName);

    const result = serializer(value);

    visitedObjects.put(value, result);

    return result;
};

JsonSerializer.prototype.serialize = function (value) {
    const type = value.constructor.@schema;

    return this.__serialize(value, type, new Map());
};

JsonSerializer.prototype.addSerializer = function (name, serializer) {
    this.serializers[name] = serializer;
};

/**
 *
 * @param {String} typeName
 * @returns {function}
 */
JsonSerializer.prototype.getSerializer = function (typeName) {
    let serializer = this.serializers[typeName];

    if (serializer === undefined) {
        const schema = this.registry.get(typeName);
        serializer = this.buildSerializer(schema);
        this.addSerializer(typeName, serializer);
    }

    return serializer;
};

/**
 *
 * @param {Type} type
 */
JsonSerializer.prototype.buildSerializer = function (type) {

    const fields = type.fields;

    const fieldSerializers = [];
    const fieldCount = fields.length;

    const serializerNames = [];

    for (let i = 0; i < fieldCount; i++) {
        const field = fields[i];

        const fieldType = field.type;

        serializerNames[i] = "$" + field.name;

        fieldSerializers[i] = this.getSerializer(fieldType.name);
    }

    const lb = new LineBuilder();

    lb.add("return function(value){")
        .indent()
        .add("return {")
        .indent();

    for (let i = 0; i < fieldCount; i++) {
        const field = fields[i];

        const serializerName = serializerNames[i];

        const lastLine = i + 1 >= fieldCount;

        const accessorSnippet = "value." + field.name + (field.observed ? ".get()" : "");
        const serializedValueSnippet = serializerName + "(" + accessorSnippet + ")";

        lb.add(field.name + " : " + serializedValueSnippet + (lastLine ? "" : ","));
    }

    lb.dedent()
        .add("};")
        .dedent()
        .add("};");


    const builder = new Function(serializerNames, lb.build());

    return builder(fieldSerializers);
};

export default JsonSerializer;