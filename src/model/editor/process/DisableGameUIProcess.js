import { Process } from "./Process.js";
import GUIElement from "../../engine/ecs/gui/GUIElement.js";

class DisableGameUIProcess extends Process {

    constructor() {
        super();

        this.name = DisableGameUIProcess.Id;
    }

    initialize(editor) {
        super.initialize(editor);
    }

    startup() {
        super.startup();

        const em = this.editor.engine.entityManager;

        const guiElementSystem = em.getSystemByComponentClass(GUIElement);

        if (guiElementSystem !== null) {
            guiElementSystem.view.visible = false;
        }
    }

    shutdown() {
        super.shutdown();

        const em = this.editor.engine.entityManager;

        const guiElementSystem = em.getSystemByComponentClass(GUIElement);

        if (guiElementSystem !== null) {
            guiElementSystem.view.visible = true;
        }
    }
}

DisableGameUIProcess.Id = 'disable-game-user-interface';

export { DisableGameUIProcess };
