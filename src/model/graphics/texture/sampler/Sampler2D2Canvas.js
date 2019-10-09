/**
 * Created by Alex on 31/10/2014.
 */


/**
 *
 * @param {Sampler2D} sampler
 * @param {Number} scale
 * @param {Number} offset
 * @param {HTMLCanvasElement} [canvas] if no canvas is supplied, a new one will be created
 * @param {function(index:int, array:ArrayLike, x:int, y:int)} [fillDD] allows you to supply mapping function, if none is given - one will be created from sampler using {@link Sampler2D#makeArrayFiller}
 * @returns {HTMLCanvasElement} canvas
 */
function convertSampler2D2Canvas(sampler, scale, offset, canvas, fillDD) {
    scale = scale || 255;
    offset = offset || 0;
    //generate canvas
    if (canvas === undefined) {
        canvas = document.createElement('canvas');
    }
    const width = sampler.width;
    const height = sampler.height;
    if (canvas.width !== width) {
        canvas.width = width;
    }

    if (canvas.height !== height) {
        canvas.height = height;
    }

    if (height === 0 || width === 0) {
        //there is no data, just return canvas
        return canvas;
    }

    const context = canvas.getContext('2d');

    const imageData = context.createImageData(width, height);
    const array = imageData.data;
    //

    if (fillDD === undefined) {
        fillDD = sampler.makeArrayFiller(scale, offset);
    }

    let index = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            fillDD(index, array, x, y);
            index += 4;
        }
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
}

export default convertSampler2D2Canvas;
