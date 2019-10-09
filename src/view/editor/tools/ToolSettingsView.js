import View from "../../View";
import { clear } from "../../ui/controller/dat/DatGuiUtils";
import dat from 'dat.gui'

class ToolSettingsView extends View {
    constructor(tool) {
        super(tool);

        this.model = tool;

        const gui = new dat.GUI({
            autoPlace: false,
            closed: false,
            resizable: false
        });
        this.gui = gui;

        this.el = gui.domElement;

        this.build();
        this.size.set(200, 10);
    }

    setTool(tool) {
        this.model = tool;
        this.build();
    }

    build() {

        let rowCount = 0;

        function isObservedValue(v) {
            return typeof v === "object" && typeof v.onChanged === "object" && typeof v.get === "function";
        }

        function isVector1(v) {
            return typeof v === "object" && v.constructor !== undefined && v.constructor.typeName === "Vector1";
        }

        function addProperties(folder, object) {
            for (let propertyName in object) {
                const propertyValue = object[propertyName];
                if (typeof propertyValue === object) {
                    //check for observed values
                    if (isObservedValue(propertyValue) || isVector1(propertyValue)) {
                        makeProperty(folder, object, propertyName);
                    } else {
                        makeFolder(folder, propertyValue, propertyName);
                    }
                } else {
                    makeProperty(folder, object, propertyName);
                }
            }
        }

        function makeFolder(parentFolder, object, name) {
            rowCount++;

            const folder = parentFolder.addFolder(name);

            folder.closed = false;

            addProperties(folder, object);

            return folder;
        }

        function wrapObservedValue(value) {
            const op = {
                v: null
            };

            Object.defineProperty(op, "v", {
                get: function () {
                    return value.get();
                },
                set: function (v) {
                    return value.set(v);
                }
            });

            return op;
        }

        function wrapVector1(value) {
            const op = {
                v: null
            };

            Object.defineProperty(op, "v", {
                get: function () {
                    return value.getValue();
                },
                set: function (v) {
                    return value.set(v);
                }
            });

            return op;
        }

        function makeProperty(parentFolder, owner, name) {
            rowCount++;

            let control;

            try {
                const propertyValue = owner[name];
                if (isObservedValue(propertyValue)) {
                    control = parentFolder.add(wrapObservedValue(propertyValue), "v");
                    control.name(name);
                } else if (isVector1(propertyValue)) {
                    control = parentFolder.add(wrapVector1(propertyValue), "v");
                    control.name(name);
                } else {
                    control = parentFolder.add(owner, name);
                }
            } catch (e) {
                console.error("Failed to add option controller", name, e);
            }

            return control;
        }

        const gui = this.gui;


        clear(gui);

        const tool = this.model;

        if (tool !== undefined && typeof tool.settings === "object") {
            addProperties(gui, tool.settings);
        }

        this.size.set(gui.width, rowCount * 30 + 20);
    }
}


export default ToolSettingsView;
