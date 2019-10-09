/**
 * Created by Alex on 20/10/2016.
 */


import Type from './Type';
import Field from './Field';
import LineBuilder from '../../codegen/LineBuilder';

function buildJsonBody(array, makeKey, makeValue, lines) {
    let i = 0;
    const l = array.length;
    for (; i < l; i++) {
        const key = makeKey(array[i], i);
        const value = makeValue(array[i], i);
        let text = '"' + key + '" : ' + value;
        if (i + 1 < l) {
            text += ",";
        }
        lines.add(text);
    }
}

/**
 *
 * @param {Type} type
 * @param {LineBuilder} lines
 */
function buildTypePrototype(type, lines) {
    function makePrototypeMethod(name, args, bodyBuilder) {
        lines.add(type.name + '.prototype.' + name + ' = function(' + args.join(', ') + '){');
        lines.indent();
        bodyBuilder(lines);
        lines.dedent();
        lines.add('};');
    }

    //to JSON
    makePrototypeMethod('toJSON', [], function (lines) {
        lines.add('return {');
        lines.indent();

        buildJsonBody(type.fields, function (field) {
            return field.name;
        }, function (field) {
            return field.type.cgValueToJSON('this.' + field.name);
        }, lines);

        lines.dedent();
        lines.add('};');
    });

    //from JSON
    makePrototypeMethod('fromJSON', ['json'], function (lines) {
        type.fields.forEach(function (field) {
            lines.add(field.type.cgAssignValueFromJSON('this.' + field.name, 'json.' + field.name));
        });
    });
}

/**
 *
 * @param {Type} structure
 */
function buildConstructorFunction(structure) {
    const lines = new LineBuilder();

    const requiredTypes = structure.fields.map(function (field) {
        return field.type.name;
    });

    lines.add("function " + structure.name + "(){");
    //fields
    lines.indent();
    structure.fields.forEach(function (field) {
        lines.add('this.' + field.name + " = " + field.type.cgInstantiate(field.initial) + ';');
    });
    lines.dedent();
    lines.add('}');

    buildTypePrototype(type, lines);

    lines.add('return ' + structure.name + ';');

    return new Function(requiredTypes, lines.build());
}

function StructureBuilder(name) {
    this.name = name;
    this.fields = [];
}

StructureBuilder.prototype.addField = function (name, type) {
    this.fields.push(new Field(name, type));
};

StructureBuilder.prototype.build = function () {
    const result = new Type(this.name);
    result.fields = this.fields;

    result.constructorFactory = buildConstructorFunction(result);

    return result;
};

export default StructureBuilder;