/**
 * @author Slayvin / http://slayvin.net
 */
import {
    ArrowHelper,
    Color,
    Geometry,
    Line,
    LinearFilter,
    LineBasicMaterial,
    Math as ThreeMath,
    Matrix4,
    Object3D,
    PerspectiveCamera,
    Plane,
    RGBFormat,
    Scene,
    ShaderMaterial,
    UniformsUtils,
    Vector3,
    Vector4,
    WebGLRenderTarget
} from 'three';

const Shader = {

    uniforms: {
        "mirrorColor": { value: new Color(0x7F7F7F) },
        "mirrorSampler": { value: null },
        "textureMatrix": { value: new Matrix4() }
    },

    vertexShader: [

        "uniform mat4 textureMatrix;",

        "varying vec4 mirrorCoord;",

        "void main() {",

        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
        "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
        "mirrorCoord = textureMatrix * worldPosition;",

        "gl_Position = projectionMatrix * mvPosition;",

        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform vec3 mirrorColor;",
        "uniform sampler2D mirrorSampler;",

        "varying vec4 mirrorCoord;",

        "float blendOverlay(float base, float blend) {",
        "return( base < 0.5 ? ( 2.0 * base * blend ) : (1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );",
        "}",

        "void main() {",

        "vec4 color = texture2DProj(mirrorSampler, mirrorCoord);",
        "color = vec4(blendOverlay(mirrorColor.r, color.r), blendOverlay(mirrorColor.g, color.g), blendOverlay(mirrorColor.b, color.b), 1.0);",

        "gl_FragColor = color;",

        "}"

    ].join("\n")

};

const Mirror = function (renderer, camera, options) {

    Object3D.call(this);

    this.name = 'mirror_' + this.id;

    options = options || {};

    this.matrixNeedsUpdate = true;

    const width = options.textureWidth !== undefined ? options.textureWidth : 512;
    const height = options.textureHeight !== undefined ? options.textureHeight : 512;

    this.clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;

    const mirrorColor = options.color !== undefined ? new Color(options.color) : new Color(0x7F7F7F);

    this.graphics = renderer;
    this.mirrorPlane = new Plane();
    this.normal = new Vector3(0, 0, 1);
    this.mirrorWorldPosition = new Vector3();
    this.cameraWorldPosition = new Vector3();
    this.rotationMatrix = new Matrix4();
    this.lookAtPosition = new Vector3(0, 0, -1);
    this.clipPlane = new Vector4();

    // For debug only, show the normal and plane of the mirror
    const debugMode = options.debugMode !== undefined ? options.debugMode : false;

    if (debugMode) {

        const arrow = new ArrowHelper(new Vector3(0, 0, 1), new Vector3(0, 0, 0), 10, 0xffff80);
        const planeGeometry = new Geometry();
        planeGeometry.vertices.push(new Vector3(-10, -10, 0));
        planeGeometry.vertices.push(new Vector3(10, -10, 0));
        planeGeometry.vertices.push(new Vector3(10, 10, 0));
        planeGeometry.vertices.push(new Vector3(-10, 10, 0));
        planeGeometry.vertices.push(planeGeometry.vertices[0]);
        const plane = new Line(planeGeometry, new LineBasicMaterial({ color: 0xffff80 }));

        this.add(arrow);
        this.add(plane);

    }

    if (camera instanceof PerspectiveCamera) {

        this.camera = camera;

    } else {

        this.camera = new PerspectiveCamera();
        console.log(this.name + ': camera is not a Perspective Camera!');

    }

    this.textureMatrix = new Matrix4();

    this.mirrorCamera = this.camera.clone();
    this.mirrorCamera.matrixAutoUpdate = true;

    const parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        stencilBuffer: false
    };

    this.renderTarget = new WebGLRenderTarget(width, height, parameters);
    this.renderTarget2 = new WebGLRenderTarget(width, height, parameters);

    const mirrorShader = Shader;
    const mirrorUniforms = UniformsUtils.clone(mirrorShader.uniforms);

    this.material = new ShaderMaterial({

        fragmentShader: mirrorShader.fragmentShader,
        vertexShader: mirrorShader.vertexShader,
        uniforms: mirrorUniforms

    });

    this.material.uniforms.mirrorSampler.value = this.renderTarget.texture;
    this.material.uniforms.mirrorColor.value = mirrorColor;
    this.material.uniforms.textureMatrix.value = this.textureMatrix;

    if (!ThreeMath.isPowerOfTwo(width) || !ThreeMath.isPowerOfTwo(height)) {

        this.renderTarget.texture.generateMipmaps = false;
        this.renderTarget2.texture.generateMipmaps = false;

    }

};

Mirror.prototype = Object.create(Object3D.prototype);
Mirror.prototype.constructor = Mirror;

Mirror.prototype.renderWithMirror = function (otherMirror) {

    // update the mirror matrix to mirror the current view
    this.updateTextureMatrix();
    this.matrixNeedsUpdate = false;

    // set the camera of the other mirror so the mirrored view is the reference view
    const tempCamera = otherMirror.camera;
    otherMirror.camera = this.mirrorCamera;

    // render the other mirror in temp texture
    otherMirror.renderTemp();
    otherMirror.material.uniforms.mirrorSampler.value = otherMirror.renderTarget2.texture;

    // render the current mirror
    this.render();
    this.matrixNeedsUpdate = true;

    // restore material and camera of other mirror
    otherMirror.material.uniforms.mirrorSampler.value = otherMirror.renderTarget.texture;
    otherMirror.camera = tempCamera;

    // restore texture matrix of other mirror
    otherMirror.updateTextureMatrix();

};

Mirror.prototype.updateTextureMatrix = function () {

    this.updateMatrixWorld();
    this.camera.updateMatrixWorld();

    this.mirrorWorldPosition.setFromMatrixPosition(this.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

    this.rotationMatrix.extractRotation(this.matrixWorld);

    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);

    const view = this.mirrorWorldPosition.clone().sub(this.cameraWorldPosition);
    view.reflect(this.normal).negate();
    view.add(this.mirrorWorldPosition);

    this.rotationMatrix.extractRotation(this.camera.matrixWorld);

    this.lookAtPosition.set(0, 0, -1);
    this.lookAtPosition.applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);

    const target = this.mirrorWorldPosition.clone().sub(this.lookAtPosition);
    target.reflect(this.normal).negate();
    target.add(this.mirrorWorldPosition);

    this.up.set(0, -1, 0);
    this.up.applyMatrix4(this.rotationMatrix);
    this.up.reflect(this.normal).negate();

    this.mirrorCamera.position.copy(view);
    this.mirrorCamera.up = this.up;
    this.mirrorCamera.lookAt(target);

    this.mirrorCamera.updateProjectionMatrix();
    this.mirrorCamera.updateMatrixWorld();
    this.mirrorCamera.matrixWorldInverse.getInverse(this.mirrorCamera.matrixWorld);

    // Update the texture matrix
    this.textureMatrix.set(0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0);
    this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
    this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    this.mirrorPlane.setFromNormalAndCoplanarPoint(this.normal, this.mirrorWorldPosition);
    this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);

    this.clipPlane.set(this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant);

    const q = new Vector4();
    const projectionMatrix = this.mirrorCamera.projectionMatrix;

    q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector
    let c = new Vector4();
    c = this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(q));

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = c.x;
    projectionMatrix.elements[6] = c.y;
    projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
    projectionMatrix.elements[14] = c.w;

};

Mirror.prototype.render = function (scene) {

    if (this.matrixNeedsUpdate) this.updateTextureMatrix();

    this.matrixNeedsUpdate = true;


    if (scene !== undefined && scene instanceof Scene) {

        // We can't render ourself to ourself
        const visible = this.material.visible;
        this.material.visible = false;

        const renderer = this.graphics;

        const currentVrEnabled = renderer.vr.enabled;
        const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        renderer.vr.enabled = false; // Avoid camera modification and recursion
        renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

        renderer.render(scene, this.mirrorCamera, this.renderTarget, true);

        renderer.vr.enabled = currentVrEnabled;
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

        this.material.visible = visible;

    }

};

Mirror.prototype.renderTemp = function () {

    if (this.matrixNeedsUpdate) this.updateTextureMatrix();

    this.matrixNeedsUpdate = true;

    // Render the mirrored view of the current scene into the target texture
    let scene = this;

    while (scene.parent !== null) {

        scene = scene.parent;

    }

    if (scene !== undefined && scene instanceof Scene) {

        this.graphics.render(scene, this.mirrorCamera, this.renderTarget2, true);

    }

};


export default Mirror;