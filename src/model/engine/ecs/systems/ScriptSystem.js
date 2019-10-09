/**
 * User: Alex Goldring
 * Date: 8/4/2014
 * Time: 20:53
 */
import { System } from '../System';
import Script from '../components/Script';


class ScriptSystem extends System {
    constructor() {
        super();
        this.componentClass = Script;
        //
        this.entityManager = null;
    }

    update(timeDelta) {

        const entityManager = this.entityManager;

        const dataset = entityManager.dataset;

        if (dataset === null) {
            //no dataset to update
            return;
        }

        dataset.traverseComponents(Script, function (component, entity) {
            const scripts = component.scripts;
            let i = 0;
            const l = scripts.length;
            for (; i < l; i++) {
                const script = scripts[i];

                try {
                    script(timeDelta);
                } catch (e) {
                    console.error(`ScriptComponent ${entity} threw error`, e);
                }
            }
        });
    }
}


export default ScriptSystem;
