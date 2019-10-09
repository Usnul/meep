/**
 * Created by Alex on 13/03/2017.
 */


import View from "../../../View";
import SVG from "../../../SVG";
import AABB2 from "../../../../model/core/geom/AABB2.js";
import { resizeAABB2ToFitBoundingClientRect } from "../../util/DomSizeObserver.js";

class SvgImageView extends View {
    /**
     *
     * @param {string} url
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(url, { assetManager }) {
        super(url, assetManager);

        if (assetManager === undefined) {
            throw new Error("No asset manager supplied");
        }

        const elSvg = SVG.createElement('svg');
        const elIcon = SVG.createElement("g");

        elSvg.appendChild(elIcon);

        const self = this;

        assetManager.get(url, "image/svg", function (asset) {
            const svgDom = asset.create();
            elIcon.appendChild(svgDom);
            resize(self.size.x, self.size.y);
        }, function (error) {
            console.error("Failed to load icon: " + url, error);
        });

        let currentScale = 1;

        function resize(x, y) {
            const iconSize = Math.min(x, y);

            const aabb = new AABB2();
            aabb.setNegativelyInfiniteBounds();

            resizeAABB2ToFitBoundingClientRect(elIcon, 10, aabb);

            let max = Math.max(aabb.getWidth(), aabb.getHeight());
            if (max === 0 || max === -Infinity) {
                return; //no dimensions
            }

            max /= currentScale;
            const scale = iconSize / max;
            //write new scale back
            elIcon.setAttribute("transform", "scale(" + scale + ")");
            currentScale = scale;
        }

        this.size.onChanged.add(resize);

        this.el = elSvg;
    }

    update() {
            requestAnimationFrame(function () {
                resize(self.size.x, self.size.y);
            });
        }

    link() {
        super.link();
        this.update();
    }

    unlink() {
        super.unlink();
    }
}


export default SvgImageView;
