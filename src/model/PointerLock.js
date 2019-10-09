/**
 * Created by Alex on 27/02/14.
 */



function getPointerLockElement() {
    const pointerLockElement = document.pointerLockElement ||
        document.mozPointerLockElement ||
        document.webkitPointerLockElement;
    return pointerLockElement;
}

function PointerLock(element) {
    this.element = element;
    element.requestPointerLock = element.requestPointerLock ||
        element.mozRequestPointerLock ||
        element.webkitRequestPointerLock;
    element.exitPointerLock = element.exitPointerLock ||
        element.mozExitPointerLock ||
        element.webkitExitPointerLock;
    this.pointerLockError = (function (evt) {
        console.error("failed to lock pointer", evt);
    }).bind(this);
    this.pointerLockChange = (function (evt) {
        if (this.isBound()) {
            this.emit("locked");
        } else {
            this.unlock();
        }
    }).bind(this);
}

PointerLock.prototype = new EventEmitter();
PointerLock.prototype.isBound = function () {
    return this.element === getPointerLockElement();
};
PointerLock.prototype.lock = function () {
    if (this.isBound()) {
        return;
    }
    document.addEventListener('pointerlockerror', this.pointerLockError, false);
    document.addEventListener('mozpointerlockerror', this.pointerLockError, false);
    document.addEventListener('webkitpointerlockerror', this.pointerLockError, false);

    document.addEventListener('pointerlockchange', this.pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', this.pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', this.pointerLockChange, false);
    this.element.requestPointerLock();
};
PointerLock.prototype.unlock = function () {
    document.removeEventListener('pointerlockchange', this.pointerLockChange, false);
    document.removeEventListener('mozpointerlockchange', this.pointerLockChange, false);
    document.removeEventListener('webkitpointerlockchange', this.pointerLockChange, false);
    if (this.isBound()) {
        this.element.exitPointerLock();
    }
    this.emit("unlocked");
};
export default PointerLock;
