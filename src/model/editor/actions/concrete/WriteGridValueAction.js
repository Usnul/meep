import GridField from "../../../navigation/grid/GridField";
import GridObstacle from "../../../engine/grid/components/GridObstacle";
import { Action } from "../Action.js";

class WriteGridValueAction extends Action {
    constructor(entity, x, y, value) {
        super();

        this.entity = entity;
        this.x = x;
        this.y = y;
        this.value = value;

        this.obstacle = null;
        this.oldValue = null;
    }

    apply(editor) {
        const obstacle = editor.engine.entityManager.getComponent(this.entity, GridObstacle);
        this.obstacle = obstacle;


        const gridField = obstacle2grid(obstacle);

        this.oldValue = gridField.read(this.x, this.y);
        gridField.pointSet(this.x, this.y, this.value);
    }

    revert(editor) {
        const gridField = obstacle2grid(this.obstacle);

        gridField.pointSet(this.x, this.y, this.oldValue);
    }
}

function obstacle2grid(obstacle) {
    const gridField = new GridField();

    gridField.width = obstacle.size.x;
    gridField.height = obstacle.size.y;
    gridField.data = obstacle.data;

    return gridField;
}

export default WriteGridValueAction;