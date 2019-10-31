import { MarkerGLAttributes } from "./MarkerGLAttributes.js";

/**
 *
 * @param {MinimapMarker} marker
 * @param {Transform} transform
 * @param entity
 * @param id
 * @param {MinimapMarkersGL} manager
 * @constructor
 */
export function MarkerGL(marker, transform, entity, id, manager) {
    /**
     *
     * @type {MinimapMarker}
     */
    this.marker = marker;
    this.transform = transform;
    this.entity = entity;

    this.id = id;

    this.patch = null;

    this.manager = manager;
    this.particles = manager.particles;

    this.active = false;

    const self = this;

    this.updatePosition = function () {

        const position = transform.position;

        self.particles.executeOperationWriteAttribute_Vector3(
            self.id,
            MarkerGLAttributes.AttributePosition,
            position.x,
            1,
            position.z
        );

        manager.needsRender = true;
    };

    this.updateIcon = function (newURL, oldURL) {
        const atlasManager = manager.atlasManager;

        if (oldURL !== null) {
            atlasManager.release(oldURL);
        }

        atlasManager
            .acquire(newURL)
            .then(function (patch) {
                //check if marker is still active
                if (!self.active) {
                    //marker is dead
                    return;
                }

                const patchUv = patch.uv;

                self.particles.executeOperationWriteAttribute_Vector4(
                    self.id,
                    MarkerGLAttributes.AttributePatch,
                    patchUv.position.x,
                    patchUv.position.y,
                    patchUv.size.x,
                    patchUv.size.y
                );

                manager.needsRender = true;

                self.patch = patch;
            });
    };
}

MarkerGL.prototype.startup = function () {
    this.active = true;

    this.transform.position.process(this.updatePosition);
    this.marker.iconURL.onChanged.add(this.updateIcon);
    this.updateIcon(this.marker.iconURL.getValue(), null);

    this.particles.executeOperationWriteAttribute_Scalar(
        this.id,
        MarkerGLAttributes.AttributeSize,
        this.marker.size.x
    );
};

MarkerGL.prototype.shutdown = function () {
    this.active = false;

    this.transform.position.onChanged.remove(this.updatePosition);

    this.marker.iconURL.onChanged.remove(this.updateIcon);

    //release reference to icon
    this.manager.atlasManager.release(this.marker.iconURL.getValue());
};
