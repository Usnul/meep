/**
 * User: Alex Goldring
 * Date: 17/6/2014
 * Time: 21:26
 */


function Mortality(actions) {
    if (actions === void 0) {
        actions = []
    } else if (typeof actions === "function") {
        actions = [actions];
    }
    this.actions = actions;
}

Mortality.typeName = "Mortality";

Mortality.serializable = false;

export default Mortality;

