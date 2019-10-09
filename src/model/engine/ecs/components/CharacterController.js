/**
 * User: Alex Goldring
 * Date: 7/4/2014
 * Time: 09:04
 */


function CharacterController(options) {
    this.height = 4;
    this.onSolidSurface = false;
    this.lockedTimeout = 0;
    //
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.sprinting = false;
    this.attacking = false;
    this.aim = null;
    //
    this.movementSpeed = options.movementSpeed || 0;
    this.sprintingMultiplier = options.sprintingMultiplier || 1;
}

export default CharacterController;
