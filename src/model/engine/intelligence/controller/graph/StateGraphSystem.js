import { System } from "../../../ecs/System.js";
import { StateGraph } from "./StateGraph.js";

export class StateGraphSystem extends System {
    constructor() {
        super();

        this.componentClass = StateGraph;
    }

    link(graph, entity) {

        this.entityManager.dataset.addEntityEventListener();
    }

    unlink(graph, entity) {

    }
}