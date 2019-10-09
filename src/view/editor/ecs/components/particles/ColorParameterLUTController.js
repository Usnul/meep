import GuiControl from "../../../../ui/controller/controls/GuiControl.js";
import View from "../../../../View.js";
import { PointerDevice } from "../../../../../model/engine/input/devices/PointerDevice.js";
import Vector2 from "../../../../../model/core/geom/Vector2.js";
import { clamp } from "../../../../../model/core/math/MathUtils.js";
import ObservedValue from "../../../../../model/core/model/ObservedValue.js";
import { ColorPickerView } from "../../../../ui/elements/ColorPickerView.js";
import Vector1 from "../../../../../model/core/geom/Vector1.js";
import Vector4 from "../../../../../model/core/geom/Vector4.js";
import { ParameterLookupTableFlags } from "../../../../../model/graphics/particles/particular/engine/parameter/ParameterLookupTableFlags.js";
import { DomSizeObserver } from "../../../../ui/util/DomSizeObserver.js";
import { AutoCanvasView } from "../common/AutoCanvasView.js";
import EmptyView from "../../../../ui/elements/EmptyView.js";


class MarkerView extends View {
    constructor() {
        super();

        const el = document.createElement('div');
        this.el = el;

        this.el.classList.add('marker-view');

        this.color = new ObservedValue();

        this.color.onChanged.add(function (value) {
            el.style.backgroundColor = value;
        });
    }
}



/**
 *
 * @param {Array.<MarkerView>} markers
 * @param {function():ParameterLookupTable} model
 * @param {function} update
 * @param {HTMLCanvasElement} canvas
 * @param {Vector1} selection
 * @returns {MarkerView}
 */
function buildMarker(markers, model, update, canvas, selection) {
    const marker = new MarkerView();

    const pMarker = new PointerDevice(marker.el);
    const pGlobal = new PointerDevice(window);


    const dragAnchor = new Vector2();
    let dragScale;
    let oldPosition;

    let dragging = false;

    function handleMove(position, event) {
        event.preventDefault();
        event.stopPropagation();

        const delta = position.clone().sub(dragAnchor);

        const markerIndex = markers.indexOf(marker);

        if (markerIndex === -1) {
            //dead marker
            pMarker.stop();
            pGlobal.stop();

            return;
        }

        const lut = model();

        const positionDelta = delta.x / canvas.width;

        const newPosition = clamp(oldPosition + positionDelta, 0, 1);

        lut.positions[markerIndex] = newPosition;

        update();
    }

    function handleDragEnd() {
        pGlobal.on.move.remove(handleMove);
        pGlobal.on.up.remove(handleDragEnd);
    }

    pGlobal.on.down.add(function (position) {
        dragAnchor.copy(position);
    });

    pMarker.on.down.add(function (position, event) {
        const markerIndex = markers.indexOf(marker);

        if (markerIndex === -1) {
            //dead marker
            pMarker.stop();
            pGlobal.stop();

            return;
        }

        if (event.which === 2) {
            //middle mouse button

            event.preventDefault();
            event.stopPropagation();


            const lut = model();

            lut.positions.splice(markerIndex, 1);
            lut.data.splice(markerIndex * lut.itemSize, lut.itemSize);

            if (selection.getValue() === markerIndex) {
                selection.set(-1);
            } else if (selection.getValue() > markerIndex) {
                selection._sub(1);
            }

            update();
        } else {
            selection.set(markerIndex);
        }
    });

    pMarker.on.dragStart.add(function () {
        dragging = true;

        const lut = model();

        dragScale = lut.valueMax - lut.valueMin;
        if (dragScale === 0) {
            dragScale = 0.1;
        }

        const markerIndex = markers.indexOf(marker);

        oldPosition = lut.positions[markerIndex];

        pGlobal.on.move.add(handleMove);
        pGlobal.on.up.add(handleDragEnd);
    });

    pMarker.start();
    pGlobal.start();

    return marker;
}

/**
 *
 * @param {CanvasRenderingContext2D} context
 * @param {number} width
 * @param {number} height
 * @param {number}cellSize
 * @param {string} color1
 * @param {string} color2
 */
export function drawCheckers(context, width, height, cellSize, color1, color2) {
    const lX = Math.ceil(width / cellSize);
    const lY = Math.ceil(height / cellSize);

    let i, j;

    for (i = 0; i < lX; i++) {

        const x = i * cellSize;

        for (j = 0; j < lY; j++) {

            const y = j * cellSize;

            const color = (i + j) % 2 === 0 ? color1 : color2;

            context.fillStyle = color;

            context.fillRect(x, y, cellSize, cellSize);
        }
    }
}

/**
 *
 * @param {ParameterLookupTable} lut
 * @param {CanvasRenderingContext2D} context
 * @param {number} width
 * @param {number} height
 */
function drawGradient(lut, context, width, height) {

    //create gradient
    const gradient = context.createLinearGradient(0, 0, width, 0);

    const positions = lut.positions;

    const numValues = positions.length;

    const colorSample = [1, 1, 1, 1];
    for (let i = 0; i < numValues; i++) {
        const position = positions[i];

        lut.sample(position, colorSample);

        const r = colorSample[0] * 255;
        const g = colorSample[1] * 255;
        const b = colorSample[2] * 255;
        const a = colorSample[3];

        const color = `rgba(${r},${g},${b},${a})`;

        gradient.addColorStop(position, color);
    }

    //draw gradient
    context.fillStyle = gradient;

    context.fillRect(0, 0, width, height);
}

export class ColorParameterLUTController extends GuiControl {
    constructor() {
        super();

        const vColorPicker = new ColorPickerView();
        const color = new Vector4(1, 1, 1, 1);
        vColorPicker.model.set(color);

        const selection = new Vector1(-1);

        this.el.classList.add('color-parameter-lut-controller');

        const self = this;


        const vGradient = new EmptyView({ classList: ['gradient'] });
        this.addChild(vGradient);
        this.addChild(vColorPicker);

        const vCanvas = new AutoCanvasView({ classList: ['gradient-canvas'] });
        const canvas = vCanvas.el;

        vGradient.addChild(vCanvas);

        /**
         *
         * @type {Array.<MarkerView>}
         */
        const markers = [];

        selection.onChanged.add(function (value) {
            markers.forEach(function (markerView, index) {
                markerView.el.classList.toggle('selected', index === value);
            });

            const lut = model();

            if (value !== -1 && lut !== null) {

                const position = lut.positions[value];

                const colorArray = [];

                lut.sample(position, colorArray);

                color.set(colorArray[0], colorArray[1], colorArray[2], colorArray[3]);

            } else {
                color.set(1, 1, 1, 1);
            }
        });

        color.onChanged.add(function (r, g, b, a) {

            const lut = model();

            if (lut === null) {
                return;
            }

            const markIndex = selection.getValue();

            if (markIndex === -1) {
                return;
            }

            const address = markIndex * lut.itemSize;

            lut.data[address + 0] = r;
            lut.data[address + 1] = g;
            lut.data[address + 2] = b;
            lut.data[address + 3] = a;

            lut.computeStatistics();

            update();
        });

        /**
         *
         * @returns {ParameterLookupTable}
         */
        function model() {
            return self.model.getValue();
        }

        vCanvas.draw = function (context, width, height) {

            //clear
            context.clearRect(0, 0, width, height);

            //draw transparency checkers
            drawCheckers(context, width, height, 5, '#FFFFFF', '#999999');

            /**
             *
             * @type {ParameterLookupTable}
             */
            const lut = model();

            if (lut === null) {
                return;
            }

            drawGradient(lut, context, width, height);
        };

        function updateGradient() {
            vCanvas.render();
        }

        function createMarker() {
            const marker = buildMarker(markers, model, update, canvas, selection);

            markers.push(marker);
            vGradient.addChild(marker);
        }

        function resizeMarkerPool(size) {
            while (size < markers.length) {
                const marker = markers.pop();
                vGradient.removeChild(marker);
            }
            while (size > markers.length) {
                createMarker();
            }
        }

        function updateMarkers() {
            const lut = model();

            if (lut === null) {
                resizeMarkerPool(0);
            } else {

                const numValue = lut.positions.length;

                resizeMarkerPool(numValue);

                for (let i = 0; i < numValue; i++) {
                    const marker = markers[i];

                    const position = lut.positions[i];

                    marker.el.style.left = `${position * 100}%`;

                    const sample = [];

                    lut.sample(position, sample);

                    const r = sample[0] * 255;
                    const g = sample[1] * 255;
                    const b = sample[2] * 255;

                    const color = `rgb(${r},${g},${b})`;

                    marker.color.set(color);
                }
            }
        }

        function update() {
            updateGradient();
            updateMarkers();
        }

        const pCanvas = new PointerDevice(canvas);

        pCanvas.on.down.add(function (position, event) {
            const p = event.offsetX / canvas.width;

            const lut = model();

            //ensure that statistics are present
            lut.computeStatistics();

            const value = [];

            lut.sample(p, value);

            //erase NaN values if there are any
            for (let i = 0; i < value.length; i++) {
                if (Number.isNaN(value[i])) {
                    value[i] = 0;
                }
            }


            lut.setFlag(ParameterLookupTableFlags.WriteMode);

            lut.addValue(p, value);

            lut.clearFlag(ParameterLookupTableFlags.WriteMode);


            lut.computeStatistics();
            update();
        });

        pCanvas.start();

        this.addChild(vGradient);

        const sizeObserver = new DomSizeObserver({ depth: 5 });
        sizeObserver.dimensions.size.onChanged.add(update);

        this.on.linked.add(() => {
            update();

            sizeObserver.attach(this.el);
            sizeObserver.start();
        });

        this.on.unlinked.add(() => {
            sizeObserver.stop();
        });

        this.model.onChanged.add(function (lut, oldLut) {
            update();
        });
    }
}
