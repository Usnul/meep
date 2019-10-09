/**
 *
 * @param {number[]} bitCounts
 * @returns {{encode: function(...number):number, decode: function(value:number, result:number[]):void}}
 */
export function create32BitCodec(bitCounts) {
    const layout = [];

    const encoderFunctionBody = [];
    const encoderArguments = [];

    const decoderFunctionBody = [];

    let offsetCursor = 0;


    for (let i = 0, numVariables = bitCounts.length; i < numVariables; i++) {
        const size = bitCounts[i];

        const offset = offsetCursor;

        layout.push({ offset, size });

        offsetCursor += size;

        const encoderArgument = 'v' + i;

        encoderArguments.push(encoderArgument);

        const bitMask = (Math.pow(2, size) - 1) << offset;

        encoderFunctionBody.push(`${i > 0 ? '|' : 'return '} ( ( ${encoderArgument} ${offset > 0 ? `<<${offset}` : ''}) & ${bitMask} ) ${i === numVariables - 1 ? ';' : ''}`);

        decoderFunctionBody.push(`result[${i}] = (value & ${bitMask}) ${offset > 0 ? `>>${offset}` : ''};`);
    }


    if (offsetCursor > 32) {
        throw new Error(
            `Only up to 32 bits are supported, ${offsetCursor} were required`
        );
    }


    const encode = new Function(encoderArguments, encoderFunctionBody.join('\n'));
    const decode = new Function(['value', 'result'], decoderFunctionBody.join('\n'));

    return {
        encode,
        decode,
        layout
    };
}