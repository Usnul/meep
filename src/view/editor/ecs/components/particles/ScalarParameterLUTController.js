import GuiControl from "../../../../ui/controller/controls/GuiControl.js";
import View from "../../../../View.js";
import { PointerDevice } from "../../../../../model/engine/input/devices/PointerDevice.js";
import Vector2 from "../../../../../model/core/geom/Vector2.js";
import { clamp } from "../../../../../model/core/math/MathUtils.js";
import { ParameterLookupTableFlags } from "../../../../../model/graphics/particles/particular/engine/parameter/ParameterLookupTableFlags.js";
import LabelView from "../../../../ui/common/LabelView.js";
import Vector1 from "../../../../../model/core/geom/Vector1.js";


function computeVerticalValuePosition(v, min, max, height, lineWidth) {
    const margin = height * 0.15;


    const valueRange = max - min;

    const drawRangeY = height - lineWidth - margin * 2;
    const drawOffsetY = lineWidth / 2 + margin;

    let normalizedValue;

    if (valueRange === 0) {
        normalizedValue = 0.5;
    } else {
        normalizedValue = (v - min) / (valueRange);
    }

    const scaledValue = (1 - normalizedValue) * drawRangeY + drawOffsetY;

    return scaledValue;
}

/**
 *
 * @param level
 * @param {CanvasRenderingContext2D} context2d
 * @param width
 * @param height
 * @param {ParameterLookupTable} lut
 * @param lineWidth
 */
function drawVerticalLine(level, context2d, width, height, lut, lineWidth) {

    context2d.fillStyle = 'none';
    context2d.strokeStyle = 'rgba(255,0,0,1)';
    context2d.lineWidth = lineWidth;

    lut.computeStatistics();

    //figure out Y coordinate
    const y = computeVerticalValuePosition(level, lut.valueMin, lut.valueMax, height, lineWidth);

    context2d.beginPath();

    context2d.moveTo(0, y);

    context2d.lineTo(width, y);

    context2d.stroke();
}

/**
 *
 * @param {CanvasRenderingContext2D} context2d
 * @param {number} width
 * @param {number} height
 * @param {ParameterLookupTable} lut
 * @param {number} lineWidth
 */
function drawPlot(context2d, width, height, lut, lineWidth) {
    context2d.fillStyle = 'none';


    context2d.strokeStyle = 'rgba(255,255,255,1)';
    context2d.lineWidth = lineWidth;

    context2d.beginPath();

    lut.computeStatistics();

    let i;


    const numValues = lut.positions.length;

    for (i = 0; i < numValues; i++) {
        const j = i * lut.itemSize;
        const datum = lut.data[j];
        const position = lut.positions[i];

        const x = position * width;

        const scaledValue = computeVerticalValuePosition(datum, lut.valueMin, lut.valueMax, height, lineWidth);

        if (i === 0) {
            if (position !== 0) {
                context2d.moveTo(0, scaledValue);
                context2d.lineTo(x, scaledValue);
            } else {
                context2d.moveTo(x, scaledValue);
            }
        } else {
            context2d.lineTo(x, scaledValue);
        }


        if (i === numValues - 1 && position !== 1) {
            context2d.lineTo(width, scaledValue);
        }


    }

    context2d.stroke();
}

function buildMarker(markers, model, update, canvas) {
    const marker = new MarkerView();

    const pMarker = new PointerDevice(marker.el);
    const pGlobal = new PointerDevice(window);


    const dragAnchor = new Vector2();
    let dragScale;
    let oldValue, oldPosition;

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

        const valueDeltaNormalized = (-delta.y / canvas.height);

        const valueDelta = valueDeltaNormalized * dragScale;

        const newPosition = clamp(oldPosition + positionDelta, 0, 1);

        lut.positions[markerIndex] = newPosition;


        const newValue = oldValue + valueDelta;

        lut.data[markerIndex * lut.itemSize] = newValue;

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
        if (event.which === 2) {
            //middle mouse button

            event.preventDefault();
            event.stopPropagation();

            const markerIndex = markers.indexOf(marker);

            if (markerIndex === -1) {
                //dead marker
                pMarker.stop();
                pGlobal.stop();

                return;
            }

            const lut = model();

            lut.positions.splice(markerIndex, 1);
            lut.data.splice(markerIndex * lut.itemSize, lut.itemSize);

            update();
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

        oldValue = lut.data[markerIndex * lut.itemSize];
        oldPosition = lut.positions[markerIndex];

        pGlobal.on.move.add(handleMove);
        pGlobal.on.up.add(handleDragEnd);
    });

    pMarker.start();
    pGlobal.start();

    return marker;
}


class MarkerView extends View {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.el.classList.add('marker-view');

        //add value label
        this.value = new Vector2(0, 0);

        const yValue = new Vector1(0);

        const lY = new LabelView(yValue, { classList: ['value'] });

        this.addChild(lY);

        this.value.onChanged.add((x, y) => yValue.set(y));
    }
}


export class ScalarParameterLUTController extends GuiControl {
    constructor() {
        super();

        this.el.classList.add('scalar-parameter-lut-controller');

        const lineWidth = 2;

        const self = this;

        const canvas = document.createElement('canvas');
        canvas.width = 170;

        const context2d = canvas.getContext('2d');

        const vCanvas = new View();
        vCanvas.el = canvas;

        const markers = [];

        /**
         *
         * @returns {ParameterLookupTable}
         */
        function model() {
            return self.model.getValue();
        }

        function updatePlot() {
            const h = canvas.height;
            const w = canvas.width;

            context2d.clearRect(0, 0, w, h);
            context2d.fillStyle = 'black';
            context2d.fillRect(0, 0, w, h);


            /**
             *
             * @type {ParameterLookupTable}
             */
            const lut = self.model.getValue();


            if (lut !== null) {
                //draw a line through zero on Y axis
                drawVerticalLine(0, context2d, w, h, lut, 1);

                drawPlot(context2d, w, h, lut, lineWidth);
            }
        }

        function createMarker() {
            const marker = buildMarker(markers, model, update, canvas);

            markers.push(marker);
            self.addChild(marker);
        }

        function resizeMarkerPool(size) {
            while (size < markers.length) {
                const marker = markers.pop();
                self.removeChild(marker);
            }
            while (size > markers.length) {
                createMarker();
            }
        }

        function updateMarkers() {

            /**
             *
             * @type {ParameterLookupTable}
             */
            const lut = model();

            if (lut !== null) {
                const positions = lut.positions;

                const numValues = positions.length;

                //resize marker pool
                resizeMarkerPool(numValues);

                //move markers
                for (let i = 0; i < numValues; i++) {
                    const marker = markers[i];

                    const position = positions[i];

                    const datum = lut.data[i * lut.itemSize];

                    const y = computeVerticalValuePosition(datum, lut.valueMin, lut.valueMax, canvas.height, lineWidth);

                    const x = position * canvas.width;

                    marker.value.set(position, datum);
                    marker.position.set(x, y);
                }
            } else {
                //clear all markers
                resizeMarkerPool(0);
            }
        }

        function update() {
            updatePlot();
            updateMarkers();
        }

        const pCanvas = new PointerDevice(canvas);

        pCanvas.on.down.add(function (position, event) {
            const p = event.offsetX / canvas.width;

            const valueNormalized = event.offsetY / canvas.height;

            const lut = model();

            lut.setFlag(ParameterLookupTableFlags.WriteMode);
            if (lut.positions.length > 0) {

                //ensure that statistics are present
                lut.computeStatistics();

                const valueMin = lut.valueMin;
                const valueMax = lut.valueMax;

                const valueRange = valueMax - valueMin;
                const value = (1 - valueNormalized) * valueRange + valueMin;

                lut.addValue(p, [value]);
            } else {
                lut.addValue(p, [0]);
                lut.computeStatistics();
            }
            lut.clearFlag(ParameterLookupTableFlags.WriteMode);

            update();
        });

        pCanvas.start();

        this.addChild(vCanvas);

        this.model.onChanged.add(function () {
            update();
        });
    }
}
