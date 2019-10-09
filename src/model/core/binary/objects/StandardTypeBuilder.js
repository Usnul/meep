/**
 * Created by Alex on 14/12/2016.
 */


import LineBuilder from '../../codegen/LineBuilder';
import MultiplicityType from '../type/MultiplicityType';

function cgFieldFromJSON(field) {

}

function generateStructure(type, typeRegistry) {
    const lbConstruct = new LineBuilder();
    const lbSerialize = new LineBuilder();
    const lbDeSerialize = new LineBuilder();
    //add fields
    if (type.isPrimitive) {
        throw new Error('Can not create a constructor for primitive type');
    }
    lbSerialize.add('return {');
    lbSerialize.indent();

    type.fields.forEach(function (field, index) {
        lbConstruct.add('this.' + field.name + ' = ' + field.initial + ';');

        lbSerialize.add(field.name + ': this.' + field.name + '.toJSON()' + ((index < type.fields.length - 1) ? ',' : ''));

        lbDeSerialize.add('this.' + field.name + ' = ');
    });

    lbSerialize.dedent();
    lbSerialize.add('};');

}

function build(type, typeRegistry) {
    return typeRegistry.getOrCompute(type.name, function () {
        return generateStructure(type, typeRegistry);
    });
}


function ClassBuilder() {
    this.dependencies = [];

    this.fragments = {
        init: new LineBuilder(),
        serialize: new LineBuilder(),
        deserialize: new LineBuilder()
    };
    this.jsonFields = [];
}

ClassBuilder.prototype.loadClass = function (name) {
    const dependencies = this.dependencies;
    const length = dependencies.length;
    for (let i = 0; i < length; i++) {
        const dependency = dependencies[i];
        if (dependency === name) {
            return "$" + i;
        }
    }
    this.dependencies.push(name);
    return "$" + length;
};
/**
 *
 * @param {Field} field
 */
ClassBuilder.prototype.addField = function (field) {
    let handle;

    const fInit = this.fragments.init;
    const fDeSerialize = this.fragments.deserialize;

    const fieldType = field.type;
    const fieldName = field.name;

    const cgFieldVar = 'this.' + fieldName;

    let cgSerializedValue;

    const cgFieldJson = 'json.' + fieldName;

    if (field.multiplicity === MultiplicityType.Many) {
        handle = this.loadClass('core.collection.List');

        fInit.add(cgFieldVar + ' = new ' + handle + "();");
        cgSerializedValue = cgFieldVar + '.toJSON()';

        if (fieldType.isPrimitive) {
            fDeSerialize.add(cgFieldVar + '.fromJSON(' + cgFieldJson + ');');
        } else {
            handle = this.loadClass(fieldType.name);
            fDeSerialize.add(cgFieldVar + '.fromJSON(' + cgFieldJson + ', ' + handle + ');');
        }

    } else if (field.observed) {
        handle = this.loadClass('core.model.ObservedValue');
        fInit.add(cgFieldVar + ' = new ' + handle + "(" + field.initial + ");");
        cgSerializedValue = cgFieldVar + '.get()';
        if (!fieldType.isPrimitive) {
            cgSerializedValue += '.toJSON()';
            fDeSerialize.add(cgFieldVar + '.get().fromJSON(' + cgFieldJson + ');');
        } else {
            fDeSerialize.add(cgFieldVar + '.fromJSON(' + cgFieldJson + ');');
        }

    } else {
        fInit.add(cgFieldVar + ' = (' + field.initial + ');');
        cgSerializedValue = cgFieldVar;
        if (!fieldType.isPrimitive) {
            cgSerializedValue += '.toJSON()';
            fDeSerialize.add(cgFieldVar + '.fromJSON(' + cgFieldJson + ');');
        } else {
            fDeSerialize.add(cgFieldVar + ' = (' + cgFieldJson + ');');
        }
    }

    this.jsonFields.push(fieldName + ' : ' + cgSerializedValue);
};

export default {
    build: build
};