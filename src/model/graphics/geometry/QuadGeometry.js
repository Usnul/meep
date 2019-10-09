/**
 * Created by Alex on 01/11/2014.
 */
import { PlaneBufferGeometry } from 'three';

let faces = [[0, 1, 2], [0, 2, 3]];
let vertices = [];

const QuadGeometry = function (width, height) {
    return new PlaneBufferGeometry(width, height, 1, 1);
};

export default QuadGeometry;
