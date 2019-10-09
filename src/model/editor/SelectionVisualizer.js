import { BoxHelper, Group } from 'three';
import Mesh from "../graphics/ecs/mesh/Mesh.js";
import { EventMeshSet } from "../graphics/ecs/mesh/MeshSystem.js";
import { SignalBinding } from "../core/events/signal/SignalBinding.js";


/**
 *
 * @param entity
 * @param {EntityManager} entityManager
 * @constructor
 */
function SelectionContainer(entity, entityManager) {
    this.entity = entity;
    this.entityManager = entityManager;

    this.isLinked = false;

    const boxHelper = new BoxHelper();
    boxHelper.material.depthTest = true;
    boxHelper.material.transparent = true;

    this.boxHelper = boxHelper;

    const self = this;

    function updateMesh() {
        const mesh = entityManager.getComponent(entity, Mesh);

        if (mesh !== null && mesh !== undefined && mesh.hasMesh()) {
            boxHelper.setFromObject(mesh.mesh);
            boxHelper.visible = true;
        } else {
            boxHelper.visible = false;
        }
    }

    function updateBox() {
        boxHelper.update();
    }

    function animationLoop() {
        if (!self.isLinked) {
            return;
        }
        updateBox();
        requestAnimationFrame(animationLoop);
    }

    updateMesh();

    this.handlers = {
        updateMesh,
        animationLoop
    };
}

SelectionContainer.prototype.link = function () {
    this.isLinked = true;
    this.handlers.animationLoop();

    this.entityManager.addEntityEventListener(this.entity, EventMeshSet, this.handlers.updateMesh);
};

SelectionContainer.prototype.unlink = function () {
    this.isLinked = false;

    this.entityManager.removeEntityEventListener(this.entity, EventMeshSet, this.handlers.updateMesh);
};

/**
 *
 * @param {Editor} editor
 * @constructor
 */
function SelectionVisualizer(editor) {
    this.editor = editor;

    /**
     *
     * @returns {EntityManager}
     */
    function getEM() {
        return editor.engine.entityManager;
    }


    const group = this.group = new Group();

    const containers = [];

    function addEntity(entity) {
        //try to get a transform

        const em = getEM();

        const container = new SelectionContainer(entity, em);
        container.link();
        containers[entity] = container;

        group.add(container.boxHelper);
    }

    function removeEntity(entity) {
        const container = containers[entity];
        if (container === undefined) {
            console.error(`Failed to un-select entity ${entity}, it no container was registered.`);
            return;
        }
        container.unlink();
        delete containers[entity];

        group.remove(container.boxHelper);
    }

    this.handlers = {
        addEntity,
        removeEntity
    };

    this.bindings = [
        new SignalBinding(editor.selection.on.added, addEntity),
        new SignalBinding(editor.selection.on.removed, removeEntity)
    ]
}

SelectionVisualizer.prototype.startup = function () {
    this.editor.engine.graphics.scene.add(this.group);

    this.editor.selection.forEach(this.handlers.addEntity);

    this.bindings.forEach(function (b) {
        b.link();
    });
};

SelectionVisualizer.prototype.shutdown = function () {
    this.editor.engine.graphics.scene.remove(this.group);


    this.editor.selection.forEach(this.handlers.removeEntity);

    this.bindings.forEach(function (b) {
        b.unlink();
    });
};

export { SelectionVisualizer };
