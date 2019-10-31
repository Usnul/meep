import View from "../../../view/View.js";
import ImageView from "../../../view/ui/elements/image/ImageView.js";
import domify from "../../../view/DOM.js";

const MinimapMarkerDOMElementPrototype = domify('div').addClass('ui-minimap-marker-view').el;

export class MinimapMarkerView extends View {
    /**
     *
     * @param {Number} entity
     * @param {MinimapMarker} marker
     * @param {Transform} transform
     * @param worldScale
     * @constructor
     */
    constructor(entity, marker, transform, worldScale) {
        super();

        this.el = MinimapMarkerDOMElementPrototype.cloneNode();

        /**
         *
         * @type {MinimapMarker}
         */
        this.marker = marker;
        /**
         *
         * @type {Transform}
         */
        this.transform = transform;
        this.worldScale = worldScale;

        const imageView = new ImageView(this.marker.iconURL);


        this.addChild(imageView);

        const position = this.position;
        const size = this.size;

        function setPosition(x, y) {
            position.set(x - size.x / 2, y - size.y / 2)
        }

        this
            .bindSignal(this.transform.position.onChanged, this.__handleTransformPositionChange)
            .bindSignal(this.worldScale.onChanged, this.__handleWorldScaleChange)
            .bindSignal(this.marker.size.onChanged, this.__handleWorldSizeChange);
    }

    __handleTransformPositionChange(x, y, z) {
        setPosition(x * this.worldScale.x, z * this.worldScale.y);
    }

    __handleWorldScaleChange(x, y) {
        size.set(x * this.marker.size.x, y * this.marker.size.y);

        setPosition(this.transform.position.x * x, this.transform.position.z * y);
    }

    __handleWorldSizeChange(x, y) {
        size.set(x * this.worldScale.x, y * this.worldScale.y);
        setPosition(this.transform.position.x * this.worldScale.x, this.transform.position.z * this.worldScale.y)
    }

    link() {
        super.link();

        this.__handleWorldSizeChange(this.marker.size.x, this.marker.size.y);
        this.__handleTransformPositionChange(this.transform.position.x, this.transform.position.y, this.transform.position.z);
    }

    unlink() {
        super.unlink();
    }
}




