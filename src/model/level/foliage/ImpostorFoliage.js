/**
 * Created by Alex on 24/10/2014.
 */
/**
 * Created by Alex on 18/10/2014.
 */
import SampleTraverser from '../../graphics/texture/sampler/SampleTraverser';
import {
    Box3 as ThreeBox3,
    BufferAttribute,
    BufferGeometry,
    NormalBlending,
    PointCloud,
    PointCloudMaterial,
    Sphere as ThreeSphere,
    Vector3 as ThreeVector3,
    VertexColors
} from 'three';
import Vector2 from "../../core/geom/Vector2.js";
import Vector4 from "../../core/geom/Vector4.js";

const Foliage = function (options) {
    const size = options.size || 1;
    const lightMap = options.lightMap;
    const texture = options.texture;
    const density = options.density;
    const densityMap = options.densityMap;
    const heightMap = options.heightMap;
    let zRange = options.zRange;
    let normalAlign = options.normalAlign !== void 0 ? options.normalAlign : true;
    //
    const mapSize = new Vector2(options.width, options.height);
    //
    //
    console.time('generating impostor foliage');
    const geometry = new BufferGeometry();
    const _vertices = [];
    const _colors = [];
    let i = 0;

    const offsetY = 0.00001;

    const color = new Vector4();

    function process(x, y, z, u, v) {
        const iX = i++,
            iY = i++,
            iZ = i++;
        _vertices[iX] = x;
        _vertices[iY] = y + offsetY;
        _vertices[iZ] = z;
        //colors
        lightMap.sample(u, v, color);
        _colors[iX] = color.x / 255;
        _colors[iY] = color.y / 255;
        _colors[iZ] = color.z / 255;
    }

    const sampleTraverser = new SampleTraverser();
    sampleTraverser.resolveSpace = true;
    sampleTraverser.resolveSpaceSize = density / size;
    sampleTraverser.traverse(heightMap, densityMap, density, mapSize, process);

    const vertices = new Float32Array(i);
    const colors = new Float32Array(i);
    //copy
    vertices.set(_vertices, 0);
    colors.set(_colors, 0);
    console.log("impostor count: " + i);

    geometry.addAttribute('position', new BufferAttribute(vertices, 3));
    //if color map is present - use it
    geometry.addAttribute('color', new BufferAttribute(colors, 3));

    //bake bounding box and sphere to save computation time
    const center = new ThreeVector3(mapSize.x / 2, zRange / 2 - offsetY, mapSize.y / 2);
    geometry.boundingSphere = new ThreeSphere(center, center.length());
    geometry.boundingBox = new ThreeBox3(new ThreeVector3(0, -zRange / 2 + offsetY, 0), new ThreeVector3(mapSize.x, zRange / 2 + offsetY, mapSize.y));

    const mat = new PointCloudMaterial({
        size: size,
        map: texture,
        blending: NormalBlending,
        depthTest: true,
        depthWrite: false,
        alphaTest: 0.5,
        sizeAttenuation: true,
        vertexColors: VertexColors,
        transparent: true
        //
        //polygonOffset: true,
        //polygonOffsetFactor: -4,
        //polygonOffsetUnits: -4
    });
    mat.color.setHSL(1, 1, 1);

    const mesh = new PointCloud(geometry, mat);
    console.timeEnd('generating impostor foliage');
    //
    return mesh;
};
export default Foliage;
