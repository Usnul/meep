function ParserError(position, message, input) {
    this.position = position;
    this.message = message;
    this.input = input;
}

export default ParserError;
