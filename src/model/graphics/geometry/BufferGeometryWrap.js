/**
 * Created by Alex Goldring on 21.02.2015.
 */
const BufferGeometryWrap = function (bufferGeometry) {
    this.source = bufferGeometry;
};
BufferGeometryWrap.prototype.bindVertex = function (index, v3, writeBack) {
    const vertices = this.source.attributes.vertices;
    const vArray = vertices.array;
    const offset = (index * 3);
    v3.set(vArray[offset], vArray[offset + 1], vArray[offset + 2]);
    //
    if (writeBack) {
        v3.onChanged.add(function () {
            vArray[offset] = v3.x;
            vArray[offset + 1] = v3.y;
            vArray[offset + 2] = v3.z;
            vertices.needsUpdate = true;
        });
    }
};
BufferGeometryWrap.prototype.bindFace = function (index, face, writeBack) {

};
export default BufferGeometryWrap;