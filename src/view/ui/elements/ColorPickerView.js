import { hsv2rgb, rgb2hsv } from "../../../model/core/color/ColorUtils.js";
import GuiControl from "../controller/controls/GuiControl.js";
import { GaugeView } from "../../editor/ecs/components/color/GaugeView.js";
import Vector1 from "../../../model/core/geom/Vector1.js";
import { drawCheckers } from "../../editor/ecs/components/particles/ColorParameterLUTController.js";


export class ColorPickerView extends GuiControl {
    constructor() {
        super();

        const self = this;

        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} value
         * @param {GaugeView} view
         * @param {number} width
         * @param {number} height
         */
        function drawSaturation(ctx, value, view, width, height) {
            ctx.clearRect(0, 0, width, height);

            const gradient = ctx.createLinearGradient(0, 0, width, 0);

            const color = self.model.getValue();

            if (color === null) {
                gradient.addColorStop(0, `hsl(0, 0%, 50%)`);
                gradient.addColorStop(1, `hsl(0, 100%, 50%)`);
            } else {
                const hsv = rgb2hsv(color.x * 255, color.y * 255, color.z * 255);

                gradient.addColorStop(0, `hsl(${hsv.h * 360}, 0%, ${hsv.v * 50}% )`);
                gradient.addColorStop(1, `hsl(${hsv.h * 360}, 100%, ${hsv.v * 50}% )`);
            }


            ctx.fillStyle = gradient;

            ctx.fillRect(0, 0, width, height);
        }

        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} value
         * @param {GaugeView} view
         * @param {number} width
         * @param {number} height
         */
        function drawValue(ctx, value, view, width, height) {
            ctx.clearRect(0, 0, width, height);

            const gradient = ctx.createLinearGradient(0, 0, width, 0);

            const color = self.model.getValue();

            if (color === null) {
                gradient.addColorStop(0, `hsl(0, 0%, 0%)`);
                gradient.addColorStop(1, `hsl(0, 0%, 50%)`);
            } else {
                const hsv = rgb2hsv(color.x * 255, color.y * 255, color.z * 255);

                gradient.addColorStop(0, `hsl(${hsv.h * 360}, ${hsv.s * 100}%, 0%)`);
                gradient.addColorStop(1, `hsl(${hsv.h * 360}, ${hsv.s * 100}%, 100%)`);
            }


            ctx.fillStyle = gradient;

            ctx.fillRect(0, 0, width, height);
        }

        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} value
         * @param {GaugeView} view
         * @param {number} width
         * @param {number} height
         */
        function drawHue(ctx, value, view, width, height) {
            const gradient = ctx.createLinearGradient(0, 0, width, 0);

            for (let i = 0; i < 360; i++) {
                const offset = i / 360;
                gradient.addColorStop(offset, `hsl(${i}, 100%, 50%)`);
            }

            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = gradient;

            ctx.fillRect(0, 0, width, height);
        }

        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} value
         * @param {GaugeView} view
         * @param {number} width
         * @param {number} height
         */
        function drawAlpha(ctx, value, view, width, height) {
            ctx.clearRect(0, 0, width, height);

            drawCheckers(ctx, width, height, 4, 'white', '#999999');

            const gradient = ctx.createLinearGradient(0, 0, width, 0);

            const color = self.model.getValue();

            if (color === null) {
                gradient.addColorStop(0, `hsla(0, 0%, 50%, 0)`);
                gradient.addColorStop(1, `hsla(0, 0%, 50%, 1)`);
            } else {
                const hsv = rgb2hsv(color.x * 255, color.y * 255, color.z * 255);

                gradient.addColorStop(0, `hsla(${hsv.h * 360}, ${hsv.s * 100}%, ${hsv.v * 50}%, 0)`);
                gradient.addColorStop(1, `hsla(${hsv.h * 360}, ${hsv.s * 100}%, ${hsv.v * 50}%, 1)`);
            }


            ctx.fillStyle = gradient;

            ctx.fillRect(0, 0, width, height);
        }

        this.dRoot.addClass('color-picker-control-view');

        const vHue = new GaugeView({ name: 'H', draw: drawHue, classList: ['hue'] });
        const vSaturation = new GaugeView({ name: 'S', draw: drawSaturation, classList: ['saturation'] });
        const vValue = new GaugeView({ name: 'L', draw: drawValue, classList: ['lightness'] });
        const vAlpha = new GaugeView({ name: 'A', draw: drawAlpha, classList: ['alpha'] });

        const colorH = new Vector1();
        const colorS = new Vector1();
        const colorV = new Vector1();
        const colorA = new Vector1();

        vHue.model.set(colorH);
        vSaturation.model.set(colorS);
        vValue.model.set(colorV);
        vAlpha.model.set(colorA);


        this.addChild(vHue);
        this.addChild(vSaturation);
        this.addChild(vValue);
        this.addChild(vAlpha);

        const writeLocks = {
            h: false,
            s: false,
            l: false,
            a: false
        };

        colorH.onChanged.add(function (h) {
            if (writeLocks.h) {
                return;
            }

            const rgb = hsv2rgb(h, colorS.getValue(), colorV.getValue());

            const color = self.model.getValue();

            if (color !== null) {

                writeLocks.h = true;

                try {
                    color.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, color.w);
                } finally {
                    writeLocks.h = false;
                }

                //update other displays
                vSaturation.render();
                vValue.render();
                vAlpha.render();
            }
        });

        colorS.onChanged.add(function (s) {
            if (writeLocks.s) {
                return;
            }

            const rgb = hsv2rgb(colorH.getValue(), s, colorV.getValue());

            const color = self.model.getValue();

            if (color !== null) {

                writeLocks.s = true;

                try {
                    color.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, color.w);
                } finally {
                    writeLocks.s = false;
                }

                //update other displays
                vValue.render();
                vAlpha.render();
            }
        });

        colorV.onChanged.add(function (v) {
            if (writeLocks.v) {
                return;
            }

            const rgb = hsv2rgb(colorH.getValue(), colorS.getValue(), v);

            const color = self.model.getValue();

            if (color !== null) {
                writeLocks.v = true;

                try {
                    color.set(rgb.r / 255, rgb.g / 255, rgb.b / 255, color.w);
                } finally {
                    writeLocks.v = false;
                }

                //update other displays
                vSaturation.render();
                vAlpha.render();
            }
        });

        colorA.onChanged.add(function (a) {
            if (writeLocks.a) {
                return;
            }

            const color = self.model.getValue();

            if (color !== null) {
                writeLocks.a = true;

                try {
                    color.set(color.x, color.y, color.z, a);
                } finally {
                    writeLocks.a = false;
                }
            }
        });

        function modelValueChanged(r, g, b, a) {
            if (writeLocks.h || writeLocks.s || writeLocks.l || writeLocks.a) {
                return;
            }

            const hsv = rgb2hsv(r * 255, g * 255, b * 255);

            //aquire locks
            writeLocks.h = true;
            writeLocks.s = true;
            writeLocks.l = true;
            writeLocks.a = true;

            try {
                vHue.model.getValue().set(hsv.h);
                vSaturation.model.getValue().set(hsv.s);
                vValue.model.getValue().set(hsv.v);
                vAlpha.model.getValue().set(a);
            } finally {
                writeLocks.h = false;
                writeLocks.s = false;
                writeLocks.l = false;
                writeLocks.a = false;
            }
        }

        this.model.onChanged.add(function (v, _v) {

            if (v !== null) {
                modelValueChanged(v.x, v.y, v.z, v.w);
                v.onChanged.add(modelValueChanged);
            } else {
                modelValueChanged(0, 0, 0, 0);
            }

            if (_v !== null) {
                v.onChanged.remove(modelValueChanged);
            }
        });
    }
}