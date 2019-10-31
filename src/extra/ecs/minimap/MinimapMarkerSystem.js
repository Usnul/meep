import { System } from "../../../model/engine/ecs/System.js";
import { MinimapMarker } from "./MinimapMarker.js";

export class MinimapMarkerSystem extends System {
    /**
     *
     * @constructor
     * @extends {System}
     */
    constructor() {
        super();

        this.componentClass = MinimapMarker;
    }
}
