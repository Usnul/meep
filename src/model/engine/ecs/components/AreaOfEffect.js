/**
 * Created by Alex on 11/08/2014.
 */


function AreaOfEffect(options) {
    this.tags = options.tags.slice();
    this.radius = options.radius || new THREE.Vector3(1, 1, 1);
    this.action = options.action || void 0;
}

export default AreaOfEffect;
