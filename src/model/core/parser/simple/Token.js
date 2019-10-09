function Token(value, start, end, name, type) {
    this.value = value;
    this.start = start;
    this.end = end;
    this.name = name;
    this.type = type;
}

/**
 *
 * @param {Token} other
 * @returns {boolean}
 */
Token.prototype.equals = function (other) {
    return this.value === other.value &&
        this.start === other.start &&
        this.end === other.end &&
        this.name === other.name &&
        this.type === other.type
        ;
};

export default Token;