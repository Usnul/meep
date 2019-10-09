/**
 * Created by Alex on 11/11/2014.
 */
import { Sampler2D } from './sampler/Sampler2D';


function canvas2Sampler2D(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    let context;
    context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    return new Sampler2D(data, 4, width, height);
}

export default canvas2Sampler2D;
