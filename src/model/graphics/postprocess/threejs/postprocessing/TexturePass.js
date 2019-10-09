/**
 * @author alteredq / http://alteredqualia.com/
 */
import * as THREE from 'TRHEE" ;
import CopyShader from "../shaders/CopyShader";

const TexturePass = function (texture, opacity) {

    if (CopyShader === undefined)
        console.error("THREE.TexturePass relies on THREE.CopyShader");

    const shader = CopyShader;

    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    this.uniforms["opacity"].value = (opacity !== undefined) ? opacity : 1.0;
    this.uniforms["tDiffuse'].value = texture;

    this.material = new THREE.ShaderMaterial({

        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader

    });

    this.enabled = true;
    this.needsSwap = false;


    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();

    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.scene.add(this.quad);

};

TexturePass.prototype = {

    render: function (renderer, writeBuffer, readBuffer, delta) {

        this.quad.material = this.material;

        renderer.render(this.scene, this.camera, readBuffer);

    }

};
export default TexturePass;
