import EmptyView from "../../../../view/ui/elements/EmptyView.js";
import Vector2 from "../../../core/geom/Vector2.js";

export class TextureAtlasDebugger {
    /**
     *
     * @param {TextureAtlas} atlas
     * @param {Vector2} [scale]
     */
    constructor(atlas, { scale = new Vector2(1, 1) } = {}) {
        window.atlas = atlas;

        this.vAtlasContent = new EmptyView({ tag: 'canvas' });

        this.vAtlasContent.css({
            position: "absolute",
            top: "0",
            left: "0",
            zIndex: 1000,
            border: "1px solid red",
            pointerEvents: 'none'
        });

        const ctx = this.vAtlasContent.el.getContext('2d');

        function draw() {

            const size = atlas.size;
            if (size.x !== 0 && size.y !== 0) {
                ctx.clearRect(0, 0, size.x, size.y);

                const imageData = ctx.createImageData(size.x, size.y);
                imageData.data.set(atlas.sampler.data);

                ctx.putImageData(imageData, 0, 0);

                ctx.strokeStyle = 'red';

                //draw patch boundaries
                atlas.patches.forEach(patch => {
                    const aabb2 = patch.packing;

                    ctx.strokeRect(aabb2.x0, aabb2.y0, aabb2.getWidth(), aabb2.getHeight());

                });

            } else {
                ctx.clearRect(0, 0, 1, 1);
            }
        }

        this.vAtlasContent.size.set(0, 0);

        atlas.size.onChanged.add((x, y) => {
            const v = this.vAtlasContent;

            const w = x * scale.x;
            const h = y * scale.y;

            v.size.set(w, h);
            v.el.setAttribute('width', x);
            v.el.setAttribute('height', y);

        });

        this.vAtlasContent.on.linked.add(draw);
        atlas.on.painted.add(draw);
    }
}
