/**
 * Accelerated Datastructure to track tile usage
 * @constructor
 */
function TileUsage() {
    this.data = [];
}

/**
 *
 * @returns {TileUsage}
 */
TileUsage.prototype.clone = function () {
    const result = new TileUsage();
    result.data = this.data.slice();
    return result;
};

TileUsage.prototype.find = function (tileAddress) {
    let offset = -1;
    do {
        offset = this.data.indexOf(tileAddress, offset);
    } while (offset !== -1 && offset % 2 !== 0);

    return offset;
};

TileUsage.prototype.obtain = function (tileAddress) {
    const i = this.find(tileAddress);
    if (i !== -1) {
        return i;
    } else {
        const data = this.data;
        const result = data.length;
        data.push(tileAddress, 0);
        return result;
    }
};

TileUsage.prototype.sort = function () {
    const arr = this.data;

    function quickSort(left, right) {
        if (left < right) {
            const pivot = right;
            const partitionIndex = partition(pivot, left, right);

            //sort left and right
            quickSort(left, partitionIndex - 1);
            quickSort(partitionIndex + 1, right);
        }
        return arr;
    }

    function partition(pivot, left, right) {
        const pivotValue = arr[pivot * 2 + 1];
        let partitionIndex = left;

        for (let i = left; i < right; i++) {
            if (arr[i * 2 + 1] < pivotValue) {
                swap(arr, i, partitionIndex);
                partitionIndex++;
            }
        }
        swap(arr, right, partitionIndex);
        return partitionIndex;
    }

    function swap(arr, i, j) {
        const i2 = i * 2;
        const j2 = j * 2;

        const temp0 = arr[i2];
        const temp1 = arr[i2 + 1];

        arr[i2] = arr[j2];
        arr[i2 + 1] = arr[j2 + 1];

        arr[j2] = temp0;
        arr[j2 + 1] = temp1;
    }

    quickSort(0, this.data.length / 2);
};


TileUsage.prototype.traverseReverse = function (visitor) {
    const data = this.data;
    const length = data.length;
    for (let i = length - 1; i >= 0; i -= 2) {
        const continueFlag = visitor(data[i], data[i + 1]);
        if (continueFlag === false) {
            return;
        }
    }
};

TileUsage.prototype.traverse = function (visitor) {
    const data = this.data;
    const length = data.length;
    for (let i = 0; i < length; i += 2) {
        const continueFlag = visitor(data[i], data[i + 1]);
        if (continueFlag === false) {
            return;
        }
    }
};

TileUsage.prototype.add = function (tileAddress, count) {
    const i = this.obtain(tileAddress);
    this.data[i + 1] += count;
};

export { TileUsage };