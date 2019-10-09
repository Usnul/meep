/**
 * Created by Alex on 09/11/2014.
 */


import {
    LinearFilter,
    Mesh,
    OrthographicCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    WebGLRenderTarget
} from 'three';

function flipArrayInPlace(input, width, height) {
    const rowLength = width * 4;
    let t, x0, x1;
    let i = 0;
    const l = height >> 1;
    for (; i < l; i++) {
        //swap lines
        const k = (height - i - 1) * rowLength;
        const m = i * rowLength;
        for (let j = 0; j < rowLength; j++) {
            x0 = m + j;
            x1 = k + j;
            t = input[x0];
            input[x0] = input[x1];
            input[x1] = t;
        }
    }
}

function flipArrayViaCanvas(input, width, height) {
    const canvas = document.createElement("canvas");
    const c = canvas.getContext('2d');
    const imageData = c.createImageData(width, height);
    imageData.data.set(input);
    c.putImageData(imageData, 0, 0);
    c.translate(0, height);
    c.scale(1, -1);
    c.drawImage(canvas, 0, 0);
    const imgd = c.getImageData(0, 0, width, height);

    return imgd.data;
}

/**
 *
 * @param {WebGLRenderer} renderer
 * @param {number} width
 * @param {number} height
 * @param processShader
 * @return {{array: Uint8Array, graphics: *}}
 */
function processTexture(renderer, width, height, processShader) {
    //make a webgl renderer with orthographic camera
    renderer.setSize(width, height);
    //make camera
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new Scene();
    scene.add(camera);

    //make a quad to render
    const material = new ShaderMaterial(processShader);
    material.lights = false;
    material.fog = false;

    const quad = new Mesh(new PlaneBufferGeometry(2, 2), material);

    scene.add(quad);
    //render
    const renderTargetOptions = {
        generateMipmaps: false,
        minFilter: LinearFilter,
        stencilBuffer: false,
        depthBuffer: false
    };
    const renderTarget = new WebGLRenderTarget(width, height, renderTargetOptions);

    renderer.setRenderTarget(renderTarget);

    renderer.render(scene, camera);

    renderer.setRenderTarget(null);

    const gl = renderer.getContext();
    //void readPixels(GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, ArrayBufferView? pixels)
    const uint8Array = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, uint8Array);
    //reorder lines in the buffer to make Y axis match

    //uint8Array = flipArrayViaCanvas(uint8Array, width, height);
    //
    renderTarget.dispose();
    material.dispose();
    return {
        array: uint8Array,
        graphics: renderer
        //renderTarget: renderTarget
    };
}

export default processTexture;
