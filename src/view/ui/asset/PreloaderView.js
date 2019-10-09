/**
 * Created by Alex on 15/06/2015.
 */
import SmoothProgressBar from "../elements/SmoothProgressBar";
import View from "../../View.js";

class PreloaderView extends View {
    constructor(preloader) {
        super();

        const el = this.el = document.createElement("div");
        el.classList.add("preloader-view");

        const bar = new SmoothProgressBar();
        el.appendChild(bar.el);

        const elSectionContainer = document.createElement("div");
        elSectionContainer.classList.add("sections");

        bar.el.appendChild(elSectionContainer);
        const sections = [];

        function updateSection(level) {
            const levelAssets = preloader.assets[level];
            const levelAssetCount = levelAssets.length;
            const section = sections[level];
            const fraction = (levelAssetCount / preloader.totalAssetCount);
            section.style.width = (fraction * 100) + "%";
        }

        function updateSections() {
            sections.forEach(function (s, level) {
                updateSection(level);
            });
        }

        //
        for (let level in preloader.assets) {
            if (preloader.assets.hasOwnProperty(level)) {

                const section = sections[level] = document.createElement("div");
                section.classList.add("background");
                section.classList.add("level-" + level);
                elSectionContainer.appendChild(section);
            }
        }
        updateSections();

        preloader.on.added.add(function (def, level) {
            updateSections();
        });

        preloader.on.progress.add(function (e) {
            bar.value = e.global.value;
            bar.max = e.global.max;
        });
    }
}

export default PreloaderView;
