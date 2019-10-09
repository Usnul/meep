function equal(a, b, m) {
    assert(a === b, m) // eslint-disable-line eqeqeq
}

function notEqual(a, b, m) {
    assert(a !== b, m) // eslint-disable-line eqeqeq
}

function notOk(t, m) {
    assert(!t, m)
}

function assert(t, m) {
    if (!t) {
        throw new Error(m || 'AssertionError')
    }
}

/**
 *
 * @param {number} a
 * @param {number} b
 * @param {string} [m]
 */
function greaterThan(a, b, m) {
    assert.equal(typeof a, 'number');
    assert.equal(typeof b, 'number');

    if (!(a > b)) {
        let message = '';

        if (m !== undefined) {
            message += m + '. ';
        }

        message += `Expected ${a} > ${b}.`;

        throw new Error(message);
    }
}

const typeOfTypes = ['string', 'boolean', 'number', 'object', 'undefined', 'function', 'symbol'];

/**
 *
 * @param {*} value
 * @param {string} type
 * @param {string} valueName
 */
function typeOf(value, type, valueName = 'value') {

    assert.notEqual(typeOfTypes.indexOf(type), -1, `type must be one of [${typeOfTypes.join(', ')}], instead was '${type}'`);
    assert.equal(typeof valueName, 'string', `valueName must be a string, instead was '${typeof valueName}'`);

    assert.equal(typeof value, type, `expected ${valueName} to be ${type}, instead was '${typeof value}'(=${value})`);
}

assert.notEqual = notEqual;
assert.notOk = notOk;
assert.equal = equal;
assert.ok = assert;
assert.greaterThan = greaterThan;
assert.typeOf = typeOf;

export {
    assert
};
