import { System } from "../System.js";
import { SerializationMetadata } from "../components/SerializationMetadata.js";

export class SerializationMetadataSystem extends System {
    constructor() {
        super();

        this.componentClass = SerializationMetadata;
    }
}
