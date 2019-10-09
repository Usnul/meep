import { Mesh, NormalBlending, OrthographicCamera, PlaneBufferGeometry, Scene, ShaderMaterial } from "three";
import { ScreenSpaceQuadShader } from "../../shaders/ScreenSpaceQuadShader.js";

const uniforms = {
    tTexture: {
        type: 't',
        value: null
    }
};

const material = new ShaderMaterial({
    uniforms,
    vertexShader: ScreenSpaceQuadShader.vertexShader(),
    fragmentShader: ScreenSpaceQuadShader.fragmentShader(),
    blending: NormalBlending,
    lights: false,
    fog: false,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    vertexColors: false
});

const quad = new Mesh(new PlaneBufferGeometry(2, 2), material);

const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const scene = new Scene();
scene.add(quad);

export function renderTextureToScreenQuad(texture, renderer) {
    uniforms.tTexture.value = texture;
    renderer.render(scene, camera);
}