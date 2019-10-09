import { System } from "../../../ecs/System.js";
import { Input } from "../components/Input.js";
import { resolvePath } from "../../../../core/json/JsonUtils.js";
import { assert } from "../../../../core/assert.js";


/**
 *
 * @param {string} path
 * @param {function} action
 * @param devices
 * @param {*} thisArg
 */
function linkBinding(path, action, devices, thisArg) {
    /**
     *
     * @type {Signal}
     */
    const signal = resolvePath(devices, path);

    assert.notEqual(signal, undefined, `signal at path '${path}' is undefined`);
    assert.notEqual(signal, null, `signal at path '${path}' is null`);

    assert.ok(signal.isSignal, `expected signal.isSignal to be true, instead got '${signal.isSignal}'`);

    signal.add(action, thisArg);
}

function unlinkBinding(path, action, devices, thisArg) {
    /**
     *
     * @type {Signal}
     */
    const signal = resolvePath(devices, path);

    assert.notEqual(signal, undefined, `signal at path '${path}' is undefined`);
    assert.notEqual(signal, null, `signal at path '${path}' is null`);

    assert.ok(signal.isSignal, `expected signal.isSignal to be true, instead got '${signal.isSignal}'`);

    signal.remove(action, thisArg);
}

class BindingLink {
    /**
     *
     * @param {InputBinding} binding
     * @param {EntityComponentDataset} dataset
     * @param {number} entity
     * @param {object} devices
     */
    constructor(binding, dataset, entity, devices) {
        /**
         *
         * @type {InputBinding}
         */
        this.binding = binding;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = dataset;

        /**
         *
         * @type {number}
         */
        this.entity = entity;

        this.devices = devices;
    }

    /**
     *
     * @param {*} eventData
     */
    emit(eventData) {
        this.dataset.sendEvent(this.entity, this.binding.event, eventData);
    }

    link() {
        linkBinding(this.binding.path, this.emit, this.devices, this);
    }

    unlink() {
        unlinkBinding(this.binding.path, this.emit, this.devices, this);
    }
}


export class InputSystem extends System {
    constructor(devices) {
        super();

        this.componentClass = Input;

        this.devices = devices;

        /**
         *
         * @type {Map<number,BindingLink[]>}
         */
        this.links = new Map();
    }


    /**
     *
     * @param {Input} component
     * @param entity
     */
    link(component, entity) {
        const mapping = component.bindings;
        const dataset = this.entityManager.dataset;
        const devices = this.devices;

        const links = [];

        //create links array
        this.links.set(entity, links);

        for (let i = 0; i < mapping.length; i++) {
            const binding = mapping.get(i);

            const bindingLink = new BindingLink(binding, dataset, entity, devices);

            bindingLink.link();

            links.push(bindingLink);
        }

        //TODO support binding alteration while component is linked
    }

    /**
     *
     * @param {Input} component
     * @param entity
     */
    unlink(component, entity) {

        const bindingLinks = this.links.get(entity);

        if (bindingLinks === undefined) {
            console.error(`Bindings for entity '${entity}' not found`);
        }

        for (const bindingLink of bindingLinks) {
            bindingLink.unlink();
        }

        //cleanup
        this.links.delete(entity);
    }
}
