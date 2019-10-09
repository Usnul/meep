import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

export class TopDownCameraLander {
    constructor() {

    }
}

TopDownCameraLander.typeName = 'TopDownCameraLander';

export class TopDownCameraLanderSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = TopDownCameraLander;
        this.version = 0;
    }

    serialize(buffer, value) {

    }

    deserialize(buffer, value) {

    }
}
