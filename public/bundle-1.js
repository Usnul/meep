this['bundle-1'] = this['bundle-1'] || {};
(function () {
'use strict';

function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);
  return css;
}

function equal(a, b, m) {}

function notEqual(a, b, m) {}

function notOk(t, m) {}

function assert(t, m) {
  if (!t) {
    throw new Error(m || 'AssertionError');
  }
}

function greaterThan(a, b, m) {
  if (!(a > b)) {
    let message = '';

    if (m !== undefined) {
      message += m + '. ';
    }

    message += "Expected ".concat(a, " > ").concat(b, ".");
    throw new Error(message);
  }
}

function typeOf(value, type, valueName = 'value') {}

assert.notEqual = notEqual;
assert.notOk = notOk;
assert.equal = equal;
assert.ok = assert;
assert.greaterThan = greaterThan;
assert.typeOf = typeOf;

function clamp(value, min, max) {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
}
function max2(a, b) {
  if (a < b) {
    return b;
  } else {
    return a;
  }
}
function min2(a, b) {
  if (a < b) {
    return a;
  } else {
    return b;
  }
}
function max3(a, b, c) {
  let v = a;

  if (v < b) {
    v = b;
  }

  if (v < c) {
    v = c;
  }

  return v;
}
function min3(a, b, c) {
  let v = a;

  if (v > b) {
    v = b;
  }

  if (v > c) {
    v = c;
  }

  return v;
}
function computeHashFloat(v) {
  return Math.sin(v) * 1367130550;
}
function sign(v) {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}
function lerp(a, b, fraction) {
  return (b - a) * fraction + a;
}
function mix(a, b, portion) {
  return a * (1 - portion) + b * portion;
}
function epsilonEquals(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}
const PI2 = Math.PI * 2;
const PI_HALF = Math.PI / 2;
const EPSILON = 0.000001;

const makeTriangle = function () {
  let x0, y0, z0, x1, y1, z1;
  let aX, aY, aZ, bX, bY, bZ, cX, cY, cZ;

  function setFaceBounds(a, b, c, vertices, callback) {
    aX = vertices[a];
    aY = vertices[a + 1];
    aZ = vertices[a + 2];
    bX = vertices[b];
    bY = vertices[b + 1];
    bZ = vertices[b + 2];
    cX = vertices[c];
    cY = vertices[c + 1];
    cZ = vertices[c + 2];
    x0 = min3(aX, bX, cX);
    y0 = min3(aY, bY, cY);
    z0 = min3(aZ, bZ, cZ);
    x1 = max3(aX, bX, cX);
    y1 = max3(aY, bY, cY);
    z1 = max3(aZ, bZ, cZ);
    return callback(x0, y0, z0, x1, y1, z1);
  }

  return setFaceBounds;
}();

var IndexedTriangleBoundsComputer = {
  compute: makeTriangle
};

function fabsf(val) {
  return val >= 0 ? val : -val;
}

function intersectRay(x0, y0, z0, x1, y1, z1, oX, oY, oZ, dirX, dirY, dirZ) {
  const boxExtentsX = (x1 - x0) / 2;
  const centerX = x0 + boxExtentsX;
  const diffX = oX - centerX;
  const a = fabsf(dirX);

  if (fabsf(diffX) > boxExtentsX && diffX * dirX >= 0) {
    return false;
  }

  const boxExtentsY = (y1 - y0) / 2;
  const centerY = y0 + boxExtentsY;
  const diffY = oY - centerY;
  const b = fabsf(dirY);

  if (fabsf(diffY) > boxExtentsY && diffY * dirY >= 0) {
    return false;
  }

  const boxExtentsZ = (z1 - z0) / 2;
  const centerZ = z0 + boxExtentsZ;
  const diffZ = oZ - centerZ;
  const c = fabsf(dirZ);

  if (fabsf(diffZ) > boxExtentsZ && diffZ * dirZ >= 0) {
    return false;
  }

  const f0 = dirY * diffZ - dirZ * diffY;

  if (fabsf(f0) > boxExtentsY * c + boxExtentsZ * b) {
    return false;
  }

  const f1 = dirZ * diffX - dirX * diffZ;

  if (fabsf(f1) > boxExtentsX * c + boxExtentsZ * a) {
    return false;
  }

  const f2 = dirX * diffY - dirY * diffX;

  if (fabsf(f2) > boxExtentsX * b + boxExtentsY * a) {
    return false;
  }

  return true;
}

const NodeType = {
  LEAF: 0,
  BINARY: 1
};

const IndexedBinaryBVH = function () {
  this.leafNodeCount = 0;
  this.binaryNodeCount = 0;
  this.boxCount = 0;
  this.data = null;
};

IndexedBinaryBVH.prototype.initialize = function (leafCount) {
  const twoLog = Math.log(leafCount) / Math.log(2);
  const twoLeafLimit = Math.pow(2, Math.ceil(twoLog));
  const binaryNodeCount = twoLeafLimit - 1;
  this.leafNodeCount = leafCount;
  this.binaryNodeCount = binaryNodeCount;
  this.boxCount = this.leafNodeCount + this.binaryNodeCount;
  this.data = new Float32Array(this.boxCount * 6);
};

function readBox(array, address, callback) {
  callback(array[address], array[address + 1], array[address + 2], array[address + 3], array[address + 4], array[address + 5]);
}

function writeBox(array, address, x0, y0, z0, x1, y1, z1) {
  array[address] = x0;
  array[address + 1] = y0;
  array[address + 2] = z0;
  array[address + 3] = x1;
  array[address + 4] = y1;
  array[address + 5] = z1;
}

function copyBox(from, to, array) {
  readBox(array, from, function (x0, y0, z0, x1, y1, z1) {
    writeBox(array, to, x0, y0, z0, x1, y1, z1);
  });
}

function copyBoxZeroSize(from, to, array) {
  readBox(array, from, function (x0, y0, z0, x1, y1, z1) {
    writeBox(array, to, x0, y0, z0, x0, y0, z0);
  });
}

function binaryNodeRefit(array, binaryNode, childNode0, childNode1) {
  readBox(array, childNode0, function (ax0, ay0, az0, ax1, ay1, az1) {
    readBox(array, childNode1, function (bx0, by0, bz0, bx1, by1, bz1) {
      const x0 = Math.min(ax0, bx0);
      const y0 = Math.min(ay0, by0);
      const z0 = Math.min(az0, bz0);
      const x1 = Math.max(ax1, bx1);
      const y1 = Math.max(ay1, by1);
      const z1 = Math.max(az1, bz1);
      writeBox(array, binaryNode, x0, y0, z0, x1, y1, z1);
    });
  });
}

IndexedBinaryBVH.prototype.unsortedBuiltIntermediate = function () {
  const data = this.data;
  const nodeCount = this.binaryNodeCount;
  const leafNodesOffset = this.binaryNodeCount * 6;
  let level = Math.floor(Math.log(nodeCount) / Math.log(2));
  let i, offset, levelNodeCount;
  levelNodeCount = Math.pow(2, level);
  offset = (levelNodeCount - 1) * 6;
  let parentIndex, childIndex0, childIndex1;

  for (i = 0; i < levelNodeCount; i++) {
    const leafIndex0 = i * 2;
    const leafIndex1 = leafIndex0 + 1;
    const leafOffset0 = leafNodesOffset + leafIndex0 * 6;
    const leafOffset1 = leafNodesOffset + leafIndex1 * 6;

    if (leafIndex1 < this.leafNodeCount) {
      binaryNodeRefit(data, offset, leafOffset0, leafOffset1);
    } else if (leafIndex0 < this.leafNodeCount) {
      copyBox(leafOffset0, offset, data);
    } else {
      copyBoxZeroSize(offset - 6, offset, data);
    }

    offset += 6;
  }

  level--;

  for (; level >= 0; level--) {
    levelNodeCount = Math.pow(2, level);
    parentIndex = levelNodeCount - 1;

    for (i = 0; i < levelNodeCount; i++) {
      childIndex0 = (parentIndex << 1) + 1;
      childIndex1 = childIndex0 + 1;
      binaryNodeRefit(data, parentIndex * 6, childIndex0 * 6, childIndex1 * 6);
      parentIndex++;
    }
  }

  const self = this;
  readBox(data, 0, function (x0, y0, z0, x1, y1, z1) {
    self.x0 = x0;
    self.y0 = y0;
    self.z0 = z0;
    self.x1 = x1;
    self.y1 = y1;
    self.z1 = z1;
  });
};

IndexedBinaryBVH.prototype.setLeafs = function (visitor) {
  let offset = this.binaryNodeCount * 6;
  const data = this.data;
  let i = 0;
  const l = this.leafNodeCount;

  for (; i < l; i++) {
    visitor(i, offset, data, writeBox);
    offset += 6;
  }

  this.unsortedBuiltIntermediate();
};

IndexedBinaryBVH.prototype.traversePreOrderStack = function (visitor, startIndex) {
  const stack = [startIndex];
  let stackSize = 1;
  const nodeThreshold = this.binaryNodeCount * 6;
  const endAddress = this.boxCount * 6;

  while (stackSize > 0) {
    stackSize--;
    const index = stack.pop();
    const address = index * 6;
    const split = visitor(address, NodeType.BINARY);

    if (split) {
      const leftIndex = (index << 1) + 1;
      const rightIndex = leftIndex + 1;
      const leftAddress = leftIndex * 6;
      const rightAddress = rightIndex * 6;

      if (rightAddress < endAddress) {
        if (rightAddress < nodeThreshold) {
          stack.push(rightIndex);
          stackSize++;
        } else {
          visitor(rightAddress, NodeType.LEAF);
        }
      }

      if (leftAddress < endAddress) {
        if (leftAddress < nodeThreshold) {
          stack.push(leftIndex);
          stackSize++;
        } else {
          visitor(leftAddress, NodeType.LEAF);
        }
      }
    }
  }
};

IndexedBinaryBVH.prototype.traversePreOrder = function (visitor, index, type) {
  const address = index * 6;
  const carryOn = visitor(address, type);
  const nodeThreshold = this.binaryNodeCount * 6;
  const endAddress = this.boxCount * 6;

  if (carryOn !== false) {
    const leftIndex = (index << 1) + 1;
    const rightIndex = leftIndex + 1;
    const leftAddress = leftIndex * 6;
    const rightAddress = rightIndex * 6;

    if (leftAddress < endAddress) {
      if (leftAddress < nodeThreshold) {
        this.traversePreOrder(visitor, leftIndex, NodeType.BINARY);
      } else {
        visitor(leftAddress, NodeType.LEAF);
      }
    }

    if (rightAddress < endAddress) {
      if (rightAddress < nodeThreshold) {
        this.traversePreOrder(visitor, rightIndex, NodeType.BINARY);
      } else {
        visitor(rightAddress, NodeType.LEAF);
      }
    }
  }
};

IndexedBinaryBVH.prototype.traverseRayLeafIntersections = function (startX, startY, startZ, directionX, directionY, directionZ, visitor) {
  const data = this.data;
  const binaryNodeCount = this.binaryNodeCount;
  let b;
  this.traversePreOrderStack(function (address, type) {
    readBox(data, address, function (x0, y0, z0, x1, y1, z1) {
      b = intersectRay(x0, y0, z0, x1, y1, z1, startX, startY, startZ, directionX, directionY, directionZ);
    });

    if (!b) {
      return false;
    }

    if (type === NodeType.LEAF) {
      const value = address / 6 - binaryNodeCount;
      visitor(value, address, type);
      return false;
    } else {
      return true;
    }
  }, 0);
};

const makeTriangle$1 = IndexedTriangleBoundsComputer.compute;

function buildUnsorted(vertices, indices) {
  const numNodes = indices.length / 3;
  const tree = new IndexedBinaryBVH();
  tree.initialize(numNodes);
  let iA, iB, iC;
  tree.setLeafs(function (i, offset, data, writeBox) {
    const index3 = i * 3;
    iA = indices[index3];
    iB = indices[index3 + 1];
    iC = indices[index3 + 2];
    makeTriangle$1(iA * 3, iB * 3, iC * 3, vertices, function (x0, y0, z0, x1, y1, z1) {
      writeBox(data, offset, x0, y0, z0, x1, y1, z1);
    });
    return i;
  });
  return tree;
}


var BinaryBVHFromBufferGeometry = Object.freeze({
	buildUnsorted: buildUnsorted
});

const SignalHandlerFlags = {
  RemoveAfterExecution: 1
};
class SignalHandler {
  constructor(handle, context) {
    assert.typeOf(handle, 'function', 'handle');
    this.handle = handle;
    this.context = context;
    this.flags = 0;
  }

  setFlag(flag) {
    this.flags |= flag;
  }

  clearFlag(flag) {
    this.flags &= ~flag;
  }

  writeFlag(flag, value) {
    if (value) {
      this.setFlag(flag);
    } else {
      this.clearFlag(flag);
    }
  }

  getFlag(flag) {
    return (this.flags & flag) === flag;
  }

}
SignalHandler.prototype.isSignalHandler = true;

const Signal = function () {
  this.silent = false;
  this.dispatching = false;
  this.handlers = [];
  this.__temp = [];
};

Signal.prototype.contains = function (h) {
  const handlers = this.handlers;
  const i = findSignalHandlerIndexByHandle(handlers, h);
  return i !== -1;
};

Signal.prototype.mute = function () {
  this.silent = true;
};

Signal.prototype.unmute = function () {
  this.silent = false;
};

Signal.prototype.hasHandlers = function () {
  return this.handlers.length > 0;
};

Signal.prototype.addOne = function (h, context) {
  const handler = new SignalHandler(h, context);
  handler.setFlag(SignalHandlerFlags.RemoveAfterExecution);
  this.handlers.push(handler);
};

Signal.prototype.add = function (h, context) {
  assert.typeOf(h, 'function', 'handler');

  const handler = new SignalHandler(h, context);
  this.handlers.push(handler);
};

function findSignalHandlerIndexByHandle(handlers, f) {
  const l = handlers.length;

  for (let i = 0; i < l; i++) {
    const signalHandler = handlers[i];

    if (signalHandler.handle === f) {
      return i;
    }
  }

  return -1;
}
function findSignalHandlerIndexByHandleAndContext(handlers, f, ctx) {
  const l = handlers.length;

  for (let i = 0; i < l; i++) {
    const signalHandler = handlers[i];

    if (signalHandler.handle === f && signalHandler.context === ctx) {
      return i;
    }
  }

  return -1;
}

function removeHandlerByHandler(signal, h) {
  const handlers = signal.handlers;
  let i = findSignalHandlerIndexByHandle(handlers, h);

  if (i >= 0) {
    handlers.splice(i, 1);
    return true;
  }

  return false;
}

function removeHandlerByHandlerAndContext(signal, h, ctx) {
  const handlers = signal.handlers;
  let i = findSignalHandlerIndexByHandleAndContext(handlers, h, ctx);

  if (i >= 0) {
    handlers.splice(i, 1);
    return true;
  }

  return false;
}

Signal.prototype.remove = function (h, thisArg) {
  assert.typeOf(h, 'function', 'handler');

  if (thisArg === undefined) {
    return removeHandlerByHandler(this, h);
  } else {
    return removeHandlerByHandlerAndContext(this, h, thisArg);
  }
};

function dispatchCallback(f, context, args) {
  assert.typeOf(f, 'function', 'f');

  try {
    f.apply(context, args);
  } catch (e) {
    console.error('Failed to dispatch handler', f, e);
  }
}

function dispatchViaProxy(handlers, proxy, args) {
  const length = handlers.length;
  let i, h;

  for (i = 0; i < length; i++) {
    proxy[i] = handlers[i];
  }

  for (i = length - 1; i >= 0; i--) {
    h = proxy[i];

    if (h.getFlag(SignalHandlerFlags.RemoveAfterExecution)) {
      const p = handlers.indexOf(h);
      handlers.splice(p, 1);
    }

    dispatchCallback(h.handle, h.context, args);
  }

  proxy.lenght = 0;
}

Signal.prototype.dispatch = function (...args) {
  if (this.silent) {
    return;
  }

  this.dispatching = true;
  dispatchViaProxy(this.handlers, this.__temp, args);
  this.dispatching = false;
};

Signal.prototype.send0 = function () {
  this.dispatch();
};

Signal.prototype.send1 = function (arg) {
  this.dispatch(arg);
};

Signal.prototype.send2 = function (a, b) {
  this.dispatch(a, b);
};

Signal.prototype.send3 = function (a, b, c) {
  this.dispatch(a, b, c);
};

Signal.prototype.send4 = function (a, b, c, d) {
  if (this.silent) {
    return;
  }

  const handlers = this.handlers;
  const length = handlers.length;
  const proxy = this.__temp;
  let i, h;

  for (i = 0; i < length; i++) {
    proxy[i] = handlers[i];
  }

  for (i = length - 1; i >= 0; i--) {
    h = proxy[i];

    if (h.getFlag(SignalHandlerFlags.RemoveAfterExecution)) {
      const p = handlers.indexOf(h);
      handlers.splice(p, 1);
    }

    const f = h.handle;

    try {
      f.call(h.context, a, b, c, d);
    } catch (e) {
      console.error('Failed to dispatch handler', f, e);
    }
  }

  proxy.lenght = 0;
};

Signal.prototype.isDispatching = function () {
  return this.dispatching;
};

Signal.prototype.merge = function (other) {
  const result = new Signal();

  function handler() {
    result.dispatch(arguments);
  }

  this.add(handler);
  other.add(handler);
  return result;
};

Signal.prototype.isSignal = true;

function Vector2(x = 0, y = 0) {
  this.x = x;
  this.y = y;
  this.onChanged = new Signal();
}

Vector2.up = Object.freeze(new Vector2(0, 1));
Vector2.down = Object.freeze(new Vector2(0, -1));
Vector2.left = Object.freeze(new Vector2(-1, 0));
Vector2.right = Object.freeze(new Vector2(1, 0));
Vector2.zero = Object.freeze(new Vector2(0, 0));
Vector2.prototype.isVector2 = true;

Vector2.prototype.set = function (x, y) {
  const oldX = this.x;
  const oldY = this.y;

  if (oldX !== x || oldY !== y) {
    this.x = x;
    this.y = y;

    if (this.onChanged.hasHandlers()) {
      this.onChanged.send4(x, y, oldX, oldY);
    }
  }

  return this;
};

Vector2.prototype.setX = function (x) {
  return this.set(x, this.y);
};

Vector2.prototype.setY = function (y) {
  return this.set(this.x, y);
};

Vector2.prototype._sub = function (x, y) {
  return this.set(this.x - x, this.y - y);
};

Vector2.prototype.sub = function (other) {
  return this._sub(other.x, other.y);
};

Vector2.prototype.floor = function () {
  return this.set(Math.floor(this.x), Math.floor(this.y));
};

Vector2.prototype.ceil = function () {
  return this.set(Math.ceil(this.x), Math.ceil(this.y));
};

Vector2.prototype.abs = function () {
  return this.set(Math.abs(this.x), Math.abs(this.y));
};

Vector2.prototype._mod = function (x, y) {
  return this.set(this.x % x, this.y % y);
};

Vector2.prototype.mod = function (other) {
  return this._mod(other.x, other.y);
};

Vector2.prototype.divide = function (other) {
  return this.set(this.x / other.x, this.y / other.y);
};

Vector2.prototype.multiply = function (other) {
  return this._multiply(other.x, other.y);
};

Vector2.prototype._multiply = function (x, y) {
  return this.set(this.x * x, this.y * y);
};

Vector2.prototype.max = function (other) {
  const x = max2(this.x, other.x);
  const y = max2(this.y, other.y);
  return this.set(x, y);
};

Vector2.prototype.copy = function (other) {
  return this.set(other.x, other.y);
};

Vector2.prototype.clone = function () {
  return new Vector2(this.x, this.y);
};

Vector2.prototype.negate = function () {
  return this.set(-this.x, -this.y);
};

Vector2.prototype._add = function (x, y) {
  return this.set(this.x + x, this.y + y);
};

Vector2.prototype.add = function (other) {
  return this._add(other.x, other.y);
};

Vector2.prototype.addScalar = function (val) {
  return this._add(val, val);
};

Vector2.prototype.setScalar = function (val) {
  this.set(val, val);
};

Vector2.prototype.divideScalar = function (val) {
  this.multiplyScalar(1 / val);
};

Vector2.prototype.multiplyScalar = function (val) {
  return this.set(this.x * val, this.y * val);
};

Vector2.prototype.toJSON = function () {
  return {
    x: this.x,
    y: this.y
  };
};

Vector2.prototype.fromJSON = function (obj) {
  this.set(obj.x, obj.y);
};

Vector2.prototype.toBinaryBuffer = function (buffer) {
  buffer.writeFloat64(this.x);
  buffer.writeFloat64(this.y);
};

Vector2.prototype.fromBinaryBuffer = function (buffer) {
  const x = buffer.readFloat64();
  const y = buffer.readFloat64();
  this.set(x, y);
};

Vector2.prototype.toBinaryBufferFloat32 = function (buffer) {
  buffer.writeFloat32(this.x);
  buffer.writeFloat32(this.y);
};

Vector2.prototype.fromBinaryBufferFloat32 = function (buffer) {
  const x = buffer.readFloat32();
  const y = buffer.readFloat32();
  this.set(x, y);
};

Vector2.prototype.isZero = function () {
  return this.x === 0 && this.y === 0;
};

Vector2.prototype.clamp = function (minX, minY, maxX, maxY) {
  const x = clamp(this.x, minX, maxX);
  const y = clamp(this.y, minY, maxY);
  return this.set(x, y);
};

Vector2.prototype.clampLow = function (lowX, lowY) {
  const x = max2(this.x, lowX);
  const y = max2(this.y, lowY);
  return this.set(x, y);
};

Vector2.prototype.clampHigh = function (highX, highY) {
  const x = min2(this.x, highX);
  const y = min2(this.y, highY);
  return this.set(x, y);
};

Vector2.prototype.distanceSqrTo = function (other) {
  return this._distanceSqrTo(other.x, other.y);
};

function v2Lerp(result, a, b, fraction) {
  const x = lerp(a.x, b.x, fraction);
  const y = lerp(a.y, b.y, fraction);
  result.set(x, y);
}

Vector2.prototype.lerpVectors = function (a, b, fraction) {
  v2Lerp(this, a, b, fraction);
};

function magnitudeSqr(x, y) {
  return x * x + y * y;
}

function v2_magnitude(x, y) {
  return Math.sqrt(magnitudeSqr(x, y));
}
function v2_distance(x0, y0, x1, y1) {
  assert.typeOf(x0, 'number', 'x0');
  assert.typeOf(y0, 'number', 'y0');
  assert.typeOf(x1, 'number', 'x1');
  assert.typeOf(y1, 'number', 'y1');
  return v2_magnitude(x1 - x0, y1 - y0);
}
Vector2._distance = v2_distance;

Vector2.prototype.distanceTo = function (other) {
  return this._distanceTo(other.x, other.y);
};

Vector2.prototype._distanceSqrTo = function (x, y) {
  const dx = this.x - x;
  const dy = this.y - y;
  return magnitudeSqr(dx, dy);
};

Vector2.prototype._distanceTo = function (x, y) {
  return Math.sqrt(this._distanceSqrTo(x, y));
};

Vector2.prototype.manhattanDistanceTo = function (other) {
  const dx = Math.abs(this.x - other.x);
  const dy = Math.abs(this.y - other.y);
  return dx + dy;
};

Vector2.prototype.length = function () {
  return v2_magnitude(this.x, this.y);
};

Vector2.prototype.hashCode = function () {
  const x = this.x;
  const y = this.y;
  let hash = (x << 5) - x + y;
  hash |= 0;
  return hash;
};

Vector2.prototype.process = function (processor) {
  processor(this.x, this.y);
  this.onChanged.add(processor);
  return this;
};

Vector2.prototype.toString = function () {
  return "Vector2{x:".concat(this.x, ", y:").concat(this.y, "}");
};

Vector2.prototype.equals = function (other) {
  return this.x === other.x && this.y === other.y;
};

class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.onChanged = new Signal();
    this.isVector3 = true;
  }

  set(x, y, z) {
    const oldX = this.x;
    const oldY = this.y;
    const oldZ = this.z;

    if (x !== oldX || y !== oldY || z !== oldZ) {
      this.x = x;
      this.y = y;
      this.z = z;

      if (this.onChanged.hasHandlers()) {
        this.onChanged.dispatch(x, y, z, oldX, oldY, oldZ);
      }
    }

    return this;
  }

  setScalar(v) {
    this.set(v, v, v);
  }

  setX(v) {
    return this.set(v, this.y, this.z);
  }

  setY(v) {
    return this.set(this.x, v, this.z);
  }

  setZ(v) {
    return this.set(this.x, this.y, v);
  }

  setXY(x, y) {
    return this.set(x, y, this.z);
  }

  setXZ(x, z) {
    return this.set(x, this.y, z);
  }

  setYZ(y, z) {
    return this.set(this.x, y, z);
  }

  add(other) {
    return this._add(other.x, other.y, other.z);
  }

  _add(x, y, z) {
    return this.set(this.x + x, this.y + y, this.z + z);
  }

  sub(other) {
    return this._sub(other.x, other.y, other.z);
  }

  _sub(x, y, z) {
    return this.set(this.x - x, this.y - y, this.z - z);
  }

  _multiply(x, y, z) {
    return this.set(this.x * x, this.y * y, this.z * z);
  }

  multiply(other) {
    return this._multiply(other.x, other.y, other.z);
  }

  multiplyVectors(a, b) {
    this.set(a.x * b.x, a.y * b.y, a.z * b.z);
  }

  subScalar(val) {
    return this.set(this.x - val, this.y - val, this.z - val);
  }

  addScalar(val) {
    return this.set(this.x + val, this.y + val, this.z + val);
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  multiplyScalar(val) {
    return this.set(this.x * val, this.y * val, this.z * val);
  }

  isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }

  cross(other) {
    this.crossVectors(this, other);
    return this;
  }

  crossVectors(first, second) {
    const ax = first.x,
          ay = first.y,
          az = first.z;
    const bx = second.x,
          by = second.y,
          bz = second.z;
    const x = ay * bz - az * by;
    const y = az * bx - ax * bz;
    const z = ax * by - ay * bx;
    this.set(x, y, z);
  }

  abs() {
    return this.set(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
  }

  dot(v) {
    return Vector3.dot(this, v);
  }

  length() {
    return v3Length(this);
  }

  lengthSqr() {
    return v3LengthSqr_i(this.x, this.y, this.z);
  }

  normalize() {
    const l = this.length();

    if (l === 0) {
      return;
    }

    const m = 1 / l;
    this.multiplyScalar(m);
  }

  isNormalized(squaredError = 0.01) {
    const lengthSq = this.lengthSqr();
    return lengthSq + squaredError >= 1 && lengthSq - squaredError <= 1;
  }

  copy(other) {
    return this.set(other.x, other.y, other.z);
  }

  distanceTo(other) {
    return Math.sqrt(this.distanceToSquared(other));
  }

  negate() {
    return this.set(-this.x, -this.y, -this.z);
  }

  distanceSqrTo(other) {
    return v3LengthSqr_i(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  distanceToSquared(other) {
    return v3LengthSqr_i(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  angleTo(other) {
    return v3_angleBetween(this.x, this.y, this.z, other.x, other.y, other.z);
  }

  applyQuaternion(q) {
    var x = this.x,
        y = this.y,
        z = this.z;
    var qx = q.x,
        qy = q.y,
        qz = q.z,
        qw = q.w;
    var ix = qw * x + qy * z - qz * y;
    var iy = qw * y + qz * x - qx * z;
    var iz = qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    const _x = ix * qw + iw * -qx + iy * -qz - iz * -qy;

    const _y = iy * qw + iw * -qy + iz * -qx - ix * -qz;

    const _z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    this.set(_x, _y, _z);
  }

  sign() {
    return this.set(sign(this.x), sign(this.y), sign(this.z));
  }

  lerp(other, fraction) {
    const x = lerp(this.x, other.x, fraction);
    const y = lerp(this.y, other.y, fraction);
    const z = lerp(this.z, other.z, fraction);
    return this.set(x, y, z);
  }

  lerpVectors(a, b, fraction) {
    v3Lerp(this, a, b, fraction);
  }

  applyMatrix4_three(matrix4) {
    const x = this.x,
          y = this.y,
          z = this.z;
    const e = matrix4.elements;

    const _x = e[0] * x + e[4] * y + e[8] * z + e[12];

    const _y = e[1] * x + e[5] * y + e[9] * z + e[13];

    const _z = e[2] * x + e[6] * y + e[10] * z + e[14];

    return this.set(_x, _y, _z);
  }

  equals(other) {
    return this._equals(other.x, other.y, other.z);
  }

  _equals(x, y, z) {
    return this.x === x && this.y === y && this.z === z;
  }

  roughlyEquals(other, tolerance) {
    return this._roughlyEquals(other.x, other.y, other.z, tolerance);
  }

  _roughlyEquals(x, y, z, tolerance = EPSILON) {
    return epsilonEquals(this.x, x, tolerance) && epsilonEquals(this.y, y, tolerance) && epsilonEquals(this.z, z, tolerance);
  }

  process(processor) {
    processor(this.x, this.y, this.z);
    this.onChanged.add(processor);
    return this;
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  fromJSON(json) {
    this.copy(json);
  }

  toBinaryBuffer(buffer) {
    buffer.writeFloat64(this.x);
    buffer.writeFloat64(this.y);
    buffer.writeFloat64(this.z);
  }

  fromBinaryBuffer(buffer) {
    const x = buffer.readFloat64();
    const y = buffer.readFloat64();
    const z = buffer.readFloat64();
    this.set(x, y, z);
  }

  toBinaryBufferFloat32(buffer) {
    buffer.writeFloat32(this.x);
    buffer.writeFloat32(this.y);
    buffer.writeFloat32(this.z);
  }

  fromBinaryBufferFloat32(buffer) {
    const x = buffer.readFloat32();
    const y = buffer.readFloat32();
    const z = buffer.readFloat32();
    this.set(x, y, z);
  }

  hash() {
    let hash = computeHashFloat(this.x);
    hash = (hash << 5) - hash + computeHashFloat(this.y);
    hash = (hash << 5) - hash + computeHashFloat(this.z);
    return hash;
  }

  static dot(a, b) {
    return Vector3._dot(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  static distance(a, b) {
    return v3Length_i(a.x - b.x, a.y - b.y, a.z - b.z);
  }

}

Vector3.zero = Object.freeze(new Vector3(0, 0, 0));
Vector3.one = Object.freeze(new Vector3(1, 1, 1));
Vector3.up = Object.freeze(new Vector3(0, 1, 0));
Vector3.down = Object.freeze(new Vector3(0, -1, 0));
Vector3.left = Object.freeze(new Vector3(-1, 0, 0));
Vector3.right = Object.freeze(new Vector3(1, 0, 0));
Vector3.forward = Object.freeze(new Vector3(0, 0, 1));
Vector3.back = Object.freeze(new Vector3(0, 0, -1));
Vector3.typeName = 'Vector3';
function v3_dot(x0, y0, z0, x1, y1, z1) {
  return x0 * x1 + y0 * y1 + z0 * z1;
}
Vector3._dot = v3_dot;

function v3Length(v) {
  return v3Length_i(v.x, v.y, v.z);
}

function v3Length_i(x, y, z) {
  return Math.sqrt(v3LengthSqr_i(x, y, z));
}

function v3LengthSqr_i(x, y, z) {
  return x * x + y * y + z * z;
}

function v3_angleBetween(x0, y0, z0, x1, y1, z1) {
  const d = v3_dot(x0, y0, z0, x1, y1, z1);
  const l = v3Length_i(x0, y0, z0) * v3Length_i(x1, y1, z1);
  const theta = clamp(d / l, -1, 1);
  return Math.acos(theta);
}

function v3Lerp(result, a, b, fraction) {
  const x = lerp(a.x, b.x, fraction);
  const y = lerp(a.y, b.y, fraction);
  const z = lerp(a.z, b.z, fraction);
  result.set(x, y, z);
}

function Vector4(x, y, z, w) {
  this.x = typeof x === 'number' ? x : 0;
  this.y = typeof x === 'number' ? y : 0;
  this.z = typeof z === 'number' ? z : 0;
  this.w = typeof w === 'number' ? w : 1;
  this.onChanged = new Signal();
}

Vector4.prototype.set = function (x, y, z, w) {
  const _x = this.x;
  const _y = this.y;
  const _z = this.z;
  const _w = this.w;

  if (_x !== x || _y !== y || _z !== z || _w !== w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    if (this.onChanged.hasHandlers()) {
      this.onChanged.dispatch(x, y, z, w, _x, _y, _z, _w);
    }
  }

  return this;
};

Vector4.prototype.multiplyVector3 = function (v3) {
  const x = this.x * v3.x;
  const y = this.y * v3.y;
  const z = this.z * v3.z;
  this.set(x, y, z, this.w);
};

Vector4.prototype.multiplyScalar = function (value) {
  return this.set(this.x * value, this.y * value, this.z * value, this.w * value);
};

Vector4.prototype._applyMatrix4 = function (a0, a1, a2, a3, b0, b1, b2, b3, c0, c1, c2, c3, d0, d1, d2, d3) {
  const _x = this.x;
  const _y = this.y;
  const _z = this.z;
  const _w = this.w;
  const x = a0 * _x + b0 * _y + c0 * _z + d0 * _w;
  const y = a1 * _x + b1 * _y + c1 * _z + d1 * _w;
  const z = a2 * _x + b2 * _y + c2 * _z + d2 * _w;
  const w = a3 * _x + b3 * _y + c3 * _z + d3 * _w;
  return this.set(x, y, z, w);
};

Vector4.prototype.dot = function (other) {
  return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
};

Vector4.prototype.add3 = function (v3) {
  return this.set(this.x + v3.x, this.y + v3.y, this.z + v3.z, this.w);
};

Vector4.prototype.threeApplyMatrix4 = function (m) {
  const e = m.elements;
  return this._applyMatrix4(e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]);
};

Vector4.prototype.copy = function (vec4) {
  return this.set(vec4.x, vec4.y, vec4.z, vec4.w);
};

Vector4.prototype.clone = function () {
  const r = new Vector4();
  r.copy(this);
  return r;
};

Vector4.prototype.applyQuaternion = function (q) {
  const x = this.x;
  const y = this.y;
  const z = this.z;
  const w = this.w;
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;
  let ix = qw * x + qy * z - qz * y;
  let iy = qw * y + qz * x - qx * z;
  let iz = qw * z + qx * y - qy * x;
  let iw = -qx * x - qy * y - qz * z;

  const _x = ix * qw + iw * -qx + iy * -qz - iz * -qy;

  const _y = iy * qw + iw * -qy + iz * -qx - ix * -qz;

  const _z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

  this.set(_x, _y, _z, w);
};

Vector4.prototype.equals = function (vec4) {
  return this.x === vec4.x && this.y === vec4.y && this.z === vec4.z && this.w === vec4.w;
};

Vector4.lerp = function (v0, v1, f, result) {
  const x = lerp(v0.x, v1.x, f);
  const y = lerp(v0.y, v1.y, f);
  const z = lerp(v0.z, v1.z, f);
  const w = lerp(v0.w, v1.w, f);
  result.set(x, y, z, w);
};

Vector4.prototype.toArray = function (result) {
  result[0] = this.x;
  result[1] = this.y;
  result[2] = this.z;
  result[3] = this.w;
};

Vector4.prototype.asArray = function () {
  const result = [];
  this.toArray(result);
  return result;
};

Vector4.prototype.setFromArray = function (data, offset) {
  this.set(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
};

Vector4.prototype.toJSON = function () {
  return {
    x: this.x,
    y: this.y,
    z: this.z,
    w: this.w
  };
};

Vector4.prototype.fromJSON = function (json) {
  this.copy(json);
};

Vector4.prototype.toBinaryBuffer = function (buffer) {
  buffer.writeFloat64(this.x);
  buffer.writeFloat64(this.y);
  buffer.writeFloat64(this.z);
  buffer.writeFloat64(this.w);
};

Vector4.prototype.fromBinaryBuffer = function (buffer) {
  const x = buffer.readFloat64();
  const y = buffer.readFloat64();
  const z = buffer.readFloat64();
  const w = buffer.readFloat64();
  this.set(x, y, z, w);
};

const BlendingType = {
  Normal: 0,
  Add: 1,
  Subtract: 2,
  Multiply: 3
};

function makeVector1() {
  return 0;
}

function makeVector2() {
  return new Vector2();
}

function makeVector3() {
  return new Vector3();
}

function makeVector4() {
  return new Vector4();
}

function interpolateVectors1(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
  return filterFunction(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd);
}

function interpolateVectors2(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
  result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
  result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
  return result;
}

function interpolateVectors3(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
  result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
  result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
  result.z = filterFunction(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
  return result;
}

function interpolateVectors4(v_0_0, v_1_0, v_0_1, v_1_1, xd, yd, result) {
  result.x = filterFunction(v_0_0.x, v_1_0.x, v_0_1.x, v_1_1.x, xd, yd);
  result.y = filterFunction(v_0_0.y, v_1_0.y, v_0_1.y, v_1_1.y, xd, yd);
  result.z = filterFunction(v_0_0.z, v_1_0.z, v_0_1.z, v_1_1.z, xd, yd);
  result.w = filterFunction(v_0_0.w, v_1_0.w, v_0_1.w, v_1_1.w, xd, yd);
  return result;
}

function filterFunction(q0, q1, p0, p1, xd, yd) {
  const s0 = mix(q0, q1, xd);
  const s1 = mix(p0, p1, xd);
  return mix(s0, s1, yd);
}

function Sampler2D(data, itemSize, width, height) {
  if (!Number.isInteger(itemSize)) {
    throw new Error("itemSize must be integer, instead was ".concat(itemSize));
  }

  if (!Number.isInteger(width)) {
    throw new Error("width must be integer, instead was ".concat(width));
  }

  if (!Number.isInteger(height)) {
    throw new Error("height must be integer, instead was ".concat(height));
  }

  if (data === undefined) {
    throw new Error('data was undefined');
  }

  this.width = width;
  this.height = height;
  this.itemSize = itemSize;
  this.data = data;
  this.initialize();
}

Sampler2D.uint8 = function (itemSize, width, height) {
  const data = new Uint8Array(width * height * itemSize);
  const sampler = new Sampler2D(data, itemSize, width, height);
  return sampler;
};

Sampler2D.uint16 = function (itemSize, width, height) {
  const data = new Uint16Array(width * height * itemSize);
  const sampler = new Sampler2D(data, itemSize, width, height);
  return sampler;
};

Sampler2D.int8 = function (itemSize, width, height) {
  const data = new Int8Array(width * height * itemSize);
  const sampler = new Sampler2D(data, itemSize, width, height);
  return sampler;
};

Sampler2D.float32 = function (itemSize, width, height) {
  const data = new Float32Array(width * height * itemSize);
  const sampler = new Sampler2D(data, itemSize, width, height);
  return sampler;
};

Sampler2D.combine = function (input0, input1, result, operation) {
  assert.typeOf(operation, 'function', 'operation');
  const width = input0.width;
  const height = input0.height;
  const length = width * height;
  const arg0 = [];
  const arg1 = [];
  const res = [];
  const itemSize0 = input0.itemSize;
  const itemSize1 = input1.itemSize;
  const itemSizeR = result.itemSize;
  const data0 = input0.data;
  const data1 = input1.data;
  const dataR = result.data;
  let i, j;

  for (i = 0; i < length; i++) {
    for (j = 0; j < itemSize0; j++) {
      arg0[j] = data0[j + i * itemSize0];
    }

    for (j = 0; j < itemSize0; j++) {
      arg1[j] = data1[j + i * itemSize1];
    }

    operation(arg0, arg1, res, i);

    for (j = 0; j < itemSizeR; j++) {
      dataR[j + i * itemSizeR] = res[j];
    }
  }
};

Sampler2D.prototype.computeMax = function (channel = 0) {
  const itemSize = this.itemSize;
  assert.typeOf(channel, 'number', 'channel');
  const data = this.data;
  const l = data.length;

  if (l === 0) {
    return undefined;
  }

  let bestValue = data[channel];
  let bestIndex = channel;

  for (let i = channel + itemSize; i < l; i += itemSize) {
    const value = data[i];

    if (bestValue < value) {
      bestValue = value;
      bestIndex = i;
    }
  }

  const width = this.width;
  const itemIndex = bestIndex / this.itemSize | 0;
  const x = itemIndex % width;
  const y = itemIndex / width | 0;
  return {
    index: bestIndex,
    value: bestValue,
    x,
    y
  };
};

Sampler2D.prototype.computeMinIndices = function (result, channel = 0) {
  const itemSize = this.itemSize;
  assert.typeOf(channel, 'number', 'channel');
  const data = this.data;
  const l = data.length;

  if (l === 0) {
    return undefined;
  }

  let bestValue = data[channel];
  let resultCount = 0;

  for (let i = channel + itemSize; i < l; i += itemSize) {
    const value = data[i];

    if (bestValue > value) {
      bestValue = value;
      resultCount = 1;
      result[0] = i;
    } else if (value === bestValue) {
      result[resultCount++] = i;
    }
  }

  if (resultCount < result.length) {
    result.splice(resultCount, result.length - resultCount);
  }

  return;
};

Sampler2D.prototype.computeMin = function (channel = 0) {
  const itemSize = this.itemSize;
  assert.typeOf(channel, 'number', 'channel');
  const data = this.data;
  const l = data.length;

  if (l === 0) {
    return undefined;
  }

  let bestValue = data[channel];
  let bestIndex = channel;

  for (let i = channel + itemSize; i < l; i += itemSize) {
    const value = data[i];

    if (bestValue > value) {
      bestValue = value;
      bestIndex = i;
    }
  }

  const width = this.width;
  const itemIndex = bestIndex / this.itemSize | 0;
  const x = itemIndex % width;
  const y = itemIndex / width | 0;
  return {
    index: bestIndex,
    value: bestValue,
    x,
    y
  };
};

Sampler2D.prototype.initialize = function () {
  const width = this.width;
  const height = this.height;
  const itemSize = this.itemSize;
  const data = this.data;
  const rowSize = width * itemSize;
  let makeVector;
  let readVector;
  let interpolateVectors;

  function readVector1(address) {
    return data[address];
  }

  function readVector2(address, result) {
    result.x = data[address];
    result.y = data[address + 1];
    return result;
  }

  function readVector3(address, result) {
    result.x = data[address];
    result.y = data[address + 1];
    result.z = data[address + 2];
    return result;
  }

  function readVector4(address, result) {
    result.x = data[address];
    result.y = data[address + 1];
    result.z = data[address + 2];
    result.w = data[address + 3];
    return result;
  }

  switch (itemSize) {
    case 1:
      makeVector = makeVector1;
      readVector = readVector1;
      interpolateVectors = interpolateVectors1;
      break;

    case 2:
      makeVector = makeVector2;
      readVector = readVector2;
      interpolateVectors = interpolateVectors2;
      break;

    case 3:
      makeVector = makeVector3;
      readVector = readVector3;
      interpolateVectors = interpolateVectors3;
      break;

    case 4:
      makeVector = makeVector4;
      readVector = readVector4;
      interpolateVectors = interpolateVectors4;
      break;

    default:
      throw new Error('invalid item size (' + itemSize + ')');
  }

  const _v0 = makeVector(),
        _v1 = makeVector(),
        _v2 = makeVector(),
        _v3 = makeVector();

  function get(x, y, result) {
    const x0 = x | 0;
    const y0 = y | 0;
    const row0 = y0 * rowSize;
    const i0 = row0 + x0 * itemSize;

    if (x === x0 && y === y0) {
      return readVector(i0, result);
    }

    const q0 = readVector(i0, _v0);
    const x1 = x === x0 ? x0 : x0 + 1;
    const y1 = y === y0 ? y0 : y0 + 1;
    const xd = x - x0;
    const yd = y - y0;
    const i1 = row0 + x1 * itemSize;
    const row1 = y1 * rowSize;
    const j0 = row1 + x0 * itemSize;
    const j1 = row1 + x1 * itemSize;
    const q1 = readVector(i1, _v1);
    const p0 = readVector(j0, _v2);
    const p1 = readVector(j1, _v3);
    return interpolateVectors(q0, q1, p0, p1, xd, yd, result);
  }

  function getNearest(x, y, result) {
    const x0 = x | 0;
    const y0 = y | 0;
    const row0 = y0 * rowSize;
    const i0 = row0 + x0 * itemSize;
    return readVector(i0, result);
  }

  this.getNearest = getNearest;
  this.get = get;

  this.sample = function (u, v, result) {
    return get(u * (width - 1), v * (height - 1), result);
  };
};

Sampler2D.prototype.computeNeighbors = function (index, result) {
  const width = this.width;
  const height = this.height;
  const x = index % width;
  const y = index / width | 0;

  if (x > 0) {
    result.push(index - 1);
  }

  if (x < width - 1) {
    result.push(index + 1);
  }

  if (y > 0) {
    result.push(index - width);
  }

  if (y < height - 1) {
    result.push(index + width);
  }
};

Sampler2D.prototype.point2index = function (x, y) {
  return x + y * this.width;
};

Sampler2D.prototype.index2point = function (index, result) {
  const width = this.width;
  const x = index % width;
  const y = index / width | 0;
  result.set(x, y);
};

Sampler2D.prototype.makeArrayFiller = function (scale, offset) {
  scale = scale || 255;
  offset = offset || 0;
  const sampler = this;
  const v4 = new Vector4(1 / scale, 1 / scale, 1 / scale, 1 / scale);

  function fillDD1(index, array, x, y) {
    const val = (sampler.get(x, y) + offset) * scale | 0;
    array[index] = val;
    array[index + 1] = val;
    array[index + 2] = val;
    array[index + 3] = 255;
  }

  function fillDD2(index, array, x, y) {
    sampler.get(x, y, v4);
    const val = (v4.x + offset) * scale | 0;
    array.fill(val, index, index + 3);
    array[index + 3] = (v4.y + offset) * scale | 0;
  }

  function fillDD3(index, array, x, y) {
    sampler.get(x, y, v4);
    array[index] = (v4.x + offset) * scale | 0;
    array[index + 1] = (v4.y + offset) * scale | 0;
    array[index + 2] = (v4.z + offset) * scale | 0;
    array[index + 3] = 255;
  }

  function fillDD4(index, array, x, y) {
    sampler.get(x, y, v4);
    array[index] = (v4.x + offset) * scale | 0;
    array[index + 1] = (v4.y + offset) * scale | 0;
    array[index + 2] = (v4.z + offset) * scale | 0;
    array[index + 3] = (v4.w + offset) * scale | 0;
  }

  let fillDD;

  switch (sampler.itemSize) {
    case 1:
      fillDD = fillDD1;
      break;

    case 2:
      fillDD = fillDD2;
      break;

    case 3:
      fillDD = fillDD3;
      break;

    case 4:
      fillDD = fillDD4;
      break;

    default:
      throw new Error('unsupported item size');
      break;
  }

  return fillDD;
};

Sampler2D.prototype.copyWithMargin = function (source, sourceX, sourceY, destinationX, destinationY, width, height, marginLeft, marginRight, marginTop, marginBottom) {
  const dItemSize = this.itemSize;
  const sItemSize = source.itemSize;

  const _itemSize = Math.min(dItemSize, sItemSize);

  const dRowSize = dItemSize * this.width;
  const sRowSize = sItemSize * source.width;
  const sData = source.data;
  const dData = this.data;
  let x, y, i;
  let xMax, yMax;
  let dA, sA, dOffset, sOffset;
  sOffset = sourceY * sRowSize + sourceX * dItemSize;

  for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
    dA = y * dRowSize;

    for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  sA = sourceY * sRowSize;

  for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
    dA = y * dRowSize;

    for (x = 0; x < width; x++) {
      dOffset = dA + (x + destinationX) * dItemSize;
      sOffset = sA + (x + sourceX) * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  sOffset = sourceY * sRowSize + (sourceX + width - 1) * dItemSize;

  for (y = Math.max(0, destinationY - marginTop), yMax = destinationY; y < yMax; y++) {
    dA = y * dRowSize;

    for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  for (y = 0; y < height; y++) {
    dA = (y + destinationY) * dRowSize;
    sA = (y + sourceY) * sRowSize;
    sOffset = sA + sourceX * dItemSize;

    for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  this.copy(source, sourceX, sourceY, destinationX, destinationY, width, height);

  for (y = 0; y < height; y++) {
    dA = (y + destinationY) * dRowSize;
    sA = (y + sourceY) * sRowSize;
    sOffset = sA + (sourceX + width - 1) * dItemSize;

    for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  sOffset = (sourceY + height - 1) * sRowSize + sourceX * dItemSize;

  for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
    dA = y * dRowSize;

    for (x = Math.max(0, destinationX - marginLeft), xMax = destinationX; x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  sA = (sourceY + height - 1) * sRowSize;

  for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
    dA = y * dRowSize;

    for (x = 0; x < width; x++) {
      dOffset = dA + (x + destinationX) * dItemSize;
      sOffset = sA + (x + sourceX) * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }

  sOffset = (sourceY + height - 1) * sRowSize + (sourceX + width - 1) * dItemSize;

  for (y = destinationY + width, yMax = Math.min(this.height, y + marginBottom); y < yMax; y++) {
    dA = y * dRowSize;

    for (x = destinationX + width, xMax = Math.min(this.width, x + marginRight); x < xMax; x++) {
      dOffset = dA + x * dItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }
};

Sampler2D.prototype.copy = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {
  const _w = Math.min(width, source.width - sourceX, this.width - destinationX);

  const _h = Math.min(height, source.height - sourceY, this.height - destinationY);

  const dItemSize = this.itemSize;
  const sItemSize = source.itemSize;

  const _itemSize = Math.min(dItemSize, sItemSize);

  const dRowSize = dItemSize * this.width;
  const sRowSize = sItemSize * source.width;
  const sData = source.data;
  const dData = this.data;
  let x, y, i;

  for (y = 0; y < _h; y++) {
    const dA = (y + destinationY) * dRowSize;
    const sA = (y + sourceY) * sRowSize;

    for (x = 0; x < _w; x++) {
      const dOffset = dA + (x + destinationX) * dItemSize;
      const sOffset = sA + (x + sourceX) * sItemSize;

      for (i = 0; i < _itemSize; i++) {
        dData[dOffset + i] = sData[sOffset + i];
      }
    }
  }
};

Sampler2D.prototype.copy_sameItemSize = function (source, sourceX, sourceY, destinationX, destinationY, width, height) {
  const itemSize = this.itemSize;
  const sItemSize = source.itemSize;

  const _w = Math.min(width, source.width - sourceX, this.width - destinationX);

  const _h = Math.min(height, source.height - sourceY, this.height - destinationY);

  const dRowSize = itemSize * this.width;
  const sRowSize = itemSize * source.width;
  const sData = source.data;
  const dData = this.data;
  const patchRowSize = _w * itemSize;
  let y, i;

  for (y = 0; y < _h; y++) {
    const dA = (y + destinationY) * dRowSize;
    const sA = (y + sourceY) * sRowSize;
    const dOffset = dA + destinationX * itemSize;
    const sOffset = sA + sourceX * itemSize;

    for (i = 0; i < patchRowSize; i++) {
      dData[dOffset + i] = sData[sOffset + i];
    }
  }
};

function blendFunctionNormal(source, destination, result) {
  const a1 = source.w / 255;
  const a0 = destination.w / 255;
  result[0] = source.x * a1 + destination.x * (1 - a1);
  result[1] = source.y * a1 + destination.y * (1 - a1);
  result[2] = source.z * a1 + destination.z * (1 - a1);
  result[3] = (a1 + a0 * (1 - a1)) * 255;
}

Sampler2D.prototype.paint = function (source, sourceX, sourceY, destinationX, destinationY, width, height, blendMode) {
  let blendFunction;

  if (blendMode === BlendingType.Normal) {
    blendFunction = blendFunctionNormal;
  } else {
    throw new Error("Unsupported blendType(=".concat(blendMode, ")"));
  }

  const _w = Math.min(width, source.width - sourceX, this.width - destinationX);

  const _h = Math.min(height, source.height - sourceY, this.height - destinationY);

  const c0 = new Vector4(0, 0, 0, 255);
  const c1 = new Vector4(0, 0, 0, 255);
  const c3 = [];
  let x, y;

  for (y = 0; y < _h; y++) {
    for (x = 0; x < _w; x++) {
      this.get(x + destinationX, y + destinationY, c0);
      source.get(x + sourceY, y + sourceY, c1);
      blendFunction(c1, c0, c3);
      this.set(x, y, c3);
    }
  }
};

Sampler2D.prototype.zeroFill = function (x, y, width, height) {
  const x0 = clamp(x, 0, this.width);
  const y0 = clamp(y, 0, this.height);
  const x1 = clamp(x + width, 0, this.width);
  const y1 = clamp(y + height, 0, this.height);
  const data = this.data;
  const itemSize = this.itemSize;
  const rowSize = itemSize * this.width;
  const clearRowOffset0 = x0 * itemSize;
  const clearRowOffset1 = x1 * itemSize;

  let _y;

  for (_y = y0; _y < y1; _y++) {
    const a = _y * rowSize;
    data.fill(0, a + clearRowOffset0, a + clearRowOffset1);
  }
};

Sampler2D.prototype.fill = function (x, y, width, height, value) {
  const x0 = clamp(x, 0, this.width);
  const y0 = clamp(y, 0, this.height);
  const x1 = clamp(x + width, 0, this.width);
  const y1 = clamp(y + height, 0, this.height);
  const data = this.data;
  const itemSize = this.itemSize;
  const rowSize = itemSize * this.width;

  let _y, _x, i;

  for (_y = y0; _y < y1; _y++) {
    const a = _y * rowSize;

    for (_x = x0; _x < x1; _x++) {
      const offset = a + _x * itemSize;

      for (i = 0; i < itemSize; i++) {
        data[offset + i] = value[i];
      }
    }
  }
};

Sampler2D.prototype.set = function (x, y, value) {
  const data = this.data;
  const itemSize = this.itemSize;
  const rowSize = itemSize * this.width;
  const offset = rowSize * y + x * itemSize;

  for (let i = 0; i < itemSize; i++) {
    data[offset + i] = value[i];
  }
};

Sampler2D.prototype.traverseCircle = function (centerX, centerY, radius, visitor) {
  let x, y;
  const offsetX = centerX | 0;
  const offsetY = centerY | 0;
  const r2 = radius * radius;
  const radiusCeil = Math.ceil(radius);

  for (y = -radiusCeil; y <= radiusCeil; y++) {
    const y2 = y * y;

    for (x = -radiusCeil; x <= radiusCeil; x++) {
      if (x * x + y2 <= r2) {
        visitor(offsetX + x, offsetY + y, this);
      }
    }
  }
};

function arrayConstructorByInstance(a) {
  if (a instanceof Int8Array) {
    return Int8Array;
  } else if (a instanceof Int16Array) {
    return Int16Array;
  } else if (a instanceof Int32Array) {
    return Int32Array;
  } else if (a instanceof Uint8Array) {
    return Uint8Array;
  } else if (a instanceof Uint16Array) {
    return Uint16Array;
  } else if (a instanceof Uint32Array) {
    return Uint32Array;
  } else if (a instanceof Float32Array) {
    return Float32Array;
  } else if (a instanceof Float64Array) {
    return Float64Array;
  } else if (Array.isArray(a)) {
    return Array;
  } else {
    throw new TypeError("Unsupported array type");
  }
}

Sampler2D.prototype.resize = function (x, y, preserveData = true) {
  const itemSize = this.itemSize;
  const length = x * y * itemSize;
  const oldData = this.data;
  const Constructor = arrayConstructorByInstance(oldData);
  const newData = new Constructor(length);

  if (preserveData) {
    if (x === this.width) {
      newData.set(oldData.subarray(0, Math.min(oldData.length, length)));
    } else {
      const rowCount = min2(y, this.height);
      const columnCount = min2(x, this.width);

      for (let i = 0; i < rowCount; i++) {
        for (let j = 0; j < columnCount; j++) {
          const targetItemAddress = (i * x + j) * itemSize;
          const sourceItemAddress = (i * this.width + j) * itemSize;

          for (let k = 0; k < itemSize; k++) {
            newData[targetItemAddress + k] = oldData[sourceItemAddress + k];
          }
        }
      }
    }
  }

  this.width = x;
  this.height = y;
  this.data = newData;
  this.initialize();
};

Sampler2D.prototype.toBinaryBuffer = function (buffer) {
  buffer.writeUint16(this.width);
  buffer.writeUint16(this.height);
  buffer.writeUint8(this.itemSize);

  if (this.data instanceof Uint8Array) {
    buffer.writeUint8(0);
    buffer.writeBytes(this.data);
  } else {
    throw new TypeError("Unsupported data type");
  }
};

Sampler2D.prototype.fromBinaryBuffer = function (buffer) {
  this.width = buffer.readUint16();
  this.height = buffer.readUint16();
  this.itemSize = buffer.readUint8();
  const dataType = buffer.readUint8();

  if (dataType === 0) {
    const numBytes = this.height * this.width * this.itemSize;
    this.data = new Uint8Array(numBytes);
    buffer.readBytes(this.data, 0, numBytes);
  } else {
    throw new TypeError("Unsupported data type (".concat(dataType, ")"));
  }
};

Sampler2D.prototype.traverseOrthogonalNeighbours = function (x, y, visitor, thisArg) {
  const width = this.width;
  const height = this.height;
  const index = this.point2index(x, y);
  let i = 0;
  const data = this.data;

  if (x > 0) {
    i = index - 1;
    visitor.call(thisArg, x - 1, y, data[i], i);
  }

  if (x < width - 1) {
    i = index + 1;
    visitor.call(thisArg, x + 1, y, data[i], i);
  }

  if (y > 0) {
    i = index - width;
    visitor.call(thisArg, x, y - 1, data[i], i);
  }

  if (y < height - 1) {
    i = index + width;
    visitor.call(thisArg, x, y + 1, data[i], i);
  }
};

function normalizeNormals(normals) {
  let x, y, z, n;
  let i = 0;
  const il = normals.length;

  for (; i < il; i += 3) {
    x = normals[i];
    y = normals[i + 1];
    z = normals[i + 2];
    n = 1 / Math.sqrt(x * x + y * y + z * z);
    normals[i] *= n;
    normals[i + 1] *= n;
    normals[i + 2] *= n;
  }
}

function computeVertexNormals(vertices, normals, indices) {
  let vA, vB, vC;
  let vAx, vAy, vAz, vBx, vBy, vBz, vCx, vCy, vCz;
  let vCBx, vCBy, vCBz, vABx, vABy, vABz;
  let crossX, crossY, crossZ;
  let i = 0;
  const il = indices.length;

  for (; i < il; i += 3) {
    vA = indices[i] * 3;
    vB = indices[i + 1] * 3;
    vC = indices[i + 2] * 3;
    vAx = vertices[vA];
    vAy = vertices[vA + 1];
    vAz = vertices[vA + 2];
    vBx = vertices[vB];
    vBy = vertices[vB + 1];
    vBz = vertices[vB + 2];
    vCx = vertices[vC];
    vCy = vertices[vC + 1];
    vCz = vertices[vC + 2];
    vCBx = vCx - vBx;
    vCBy = vCy - vBy;
    vCBz = vCz - vBz;
    vABx = vAx - vBx;
    vABy = vAy - vBy;
    vABz = vAz - vBz;
    crossX = vCBy * vABz - vCBz * vABy;
    crossY = vCBz * vABx - vCBx * vABz;
    crossZ = vCBx * vABy - vCBy * vABx;
    normals[vA] += crossX;
    normals[vA + 1] += crossY;
    normals[vA + 2] += crossZ;
    normals[vB] += crossX;
    normals[vB + 1] += crossY;
    normals[vB + 2] += crossZ;
    normals[vC] += crossX;
    normals[vC + 1] += crossY;
    normals[vC + 2] += crossZ;
  }

  normalizeNormals(normals);
}

var ComputeNormals = {
  computeNormals: computeVertexNormals
};

function buildBufferGeometry(samplerHeight, position, size, scale, totalSize, resolution) {
  const width = size.x;
  const height = size.y;
  const gridX1 = width * resolution;
  const gridY1 = height * resolution;
  const gridX2 = gridX1 - 1;
  const gridY2 = gridY1 - 1;
  let offset = 0,
      offset2 = 0;
  const vertexCount = gridX1 * gridY1;
  const vertices = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  let y, x;
  const vMultiplier = size.y / totalSize.y / gridY2;
  const uMultiplier = size.x / totalSize.x / gridX2;
  const vConst = position.y / totalSize.y;
  const uConst = position.x / totalSize.x;
  const jitterU = totalSize.x < samplerHeight.width ? 0.5 * uMultiplier : 0.5 / samplerHeight.width;
  const jitterV = totalSize.y < samplerHeight.height ? 0.5 * vMultiplier : 0.5 / samplerHeight.height;
  const totalScaledSizeX = totalSize.x * scale.x;
  const totalScaledSizeY = totalSize.y * scale.y;

  function sample(u, v) {
    return samplerHeight.sample(u, v);
  }

  let px, py, pz;

  for (y = 0; y < gridY1; y++) {
    const v = y * vMultiplier + vConst;
    pz = v * totalScaledSizeY;

    for (x = 0; x < gridX1; x++) {
      const u = x * uMultiplier + uConst;
      const val = sample(u, v);
      px = u * totalScaledSizeX;
      py = val;
      vertices[offset] = px;
      vertices[offset + 1] = py;
      vertices[offset + 2] = pz;
      uvs[offset2] = u;
      uvs[offset2 + 1] = 1 - v;
      offset += 3;
      offset2 += 2;
    }
  }

  offset = 0;
  const indices = new (vertices.length / 3 > 65535 ? Uint32Array : Uint16Array)(gridX2 * gridY2 * 6);

  for (y = 0; y < gridY2; y++) {
    for (x = 0; x < gridX2; x++) {
      const a = x + gridX1 * y;
      const b = x + gridX1 * (y + 1);
      const c = x + 1 + gridX1 * (y + 1);
      const d = x + 1 + gridX1 * y;
      indices[offset] = a;
      indices[offset + 1] = b;
      indices[offset + 2] = d;
      indices[offset + 3] = b;
      indices[offset + 4] = c;
      indices[offset + 5] = d;
      offset += 6;
    }
  }

  ComputeNormals.computeNormals(vertices, normals, indices);
  return {
    indices: indices,
    vertices: vertices,
    normals: normals,
    uvs: uvs
  };
}

const Builder = {
  build: buildBufferGeometry
};

self.Lib = {
  BinaryBVHFromBufferGeometry,
  Sampler2D,
  BufferedGeometryArraysBuilder: Builder
};

}());
