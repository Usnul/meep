/**
 * Created by Alex on 21/10/2014.
 */
import * as THREE from 'three';


const Loader = function () {
    function load(options, callback) {
        const url = options.url;
        const density = options.density;
        const normalAlign = options.normalAlign;
        const size = options.size;
        const densityMap = options.densityMap;
        const randomRotateY = options.randomRotateY;
        const loader = new THREE.JSONLoader();
        loader.load(url, function (geometry, materials) {
            const material = new THREE.MultiMaterial(materials);

            callback({
                density: density,
                material: material,
                geometry: geometry,
                normalAlign: normalAlign,
                densityMap: densityMap,
                size: size,
                width: options.width,
                height: options.height,
                randomRotateY: randomRotateY,
                castShadow: options.castShadow,
                receiveShadow: options.receiveShadow
            });
        });
    }

    this.load = load;
};


export default Loader;
