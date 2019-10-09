import GuiControl from "../../../ui/controller/controls/GuiControl.js";
import dat from "dat.gui";

class DatGuiController extends GuiControl {
    constructor({ classList = [] } = {}) {
        super();

        const gui = new dat.GUI({
            autoPlace: false,
            closed: false,
            closeOnTop: false, //If true, close/open button shows on top of the GUI
            resizable: false
        });

        this.gui = gui;

        const domElement = gui.domElement;
        this.el = domElement;
        this.dRoot.el = domElement;

        this.dRoot.addClass(GuiControl.CSS_CLASS_NAME);


        classList.forEach(c => this.addClass(c));
    }

    /**
     *
     * @param {Object} object
     * @param {string} property
     * @param {Object|Array} [extra]
     * @returns {Controller}
     */
    addControl(object, property, extra) {
        const control = this.gui.add(object, property, extra);

        return control;
    }

    addFolder(name) {
        const control = this.gui.addFolder(name);


        return control;
    }

    addColorControl(object, property) {
        const control = this.gui.addColor(object, property);

        return control;
    }
}


export default DatGuiController;
