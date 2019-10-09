/**
 * Created by Alex on 13/08/2014.
 */


function RangedAttack(options) {
    this.factory = options.factory || null;
    this.speed = options.speed || 1;
    this.projectileOffset = options.offset || new THREE.Vector3(0, 0, 0);
}

export default RangedAttack;
