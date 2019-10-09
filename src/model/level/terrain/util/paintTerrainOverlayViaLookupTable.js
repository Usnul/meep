import { Sampler2D } from "../../../graphics/texture/sampler/Sampler2D.js";
import { clamp } from "../../../core/math/MathUtils.js";
import { ParameterLookupTable } from "../../../graphics/particles/particular/engine/parameter/ParameterLookupTable.js";


const heatmap_lut = new ParameterLookupTable(4);
heatmap_lut.write([
    0, 0, 0, 255,
    0, 0, 255, 255,
    0, 179, 179, 255,
    0, 255, 0, 255,
    255, 255, 0, 255,
    255, 5, 5, 255
]);
heatmap_lut.computeUniformPositions();

/**
 *
 * @param {TerrainOverlay} overlay
 * @param {Sampler2D} sampler
 * @param {ParameterLookupTable} [lut]
 * @param {NumericInterval} range Range of values of interest within the sampler that are to be mapped onto LUT
 */
export function paintTerrainOverlayViaLookupTable({ overlay, sampler, lut = heatmap_lut, range }) {
    let i, j;

    const colorSample = [];

    const w = overlay.size.x;
    const h = overlay.size.y;

    const buffer = Sampler2D.uint8(4, w, h);

    for (i = 0; i < w; i++) {
        for (j = 0; j < h; j++) {
            const p = sampler.get(i, j);

            const position = clamp(range.normalizeValue(p), 0, 1);

            lut.sample(position, colorSample);

            buffer.set(i, j, colorSample);
        }
    }

    overlay.clear();
    overlay.writeData(buffer.data);
}
