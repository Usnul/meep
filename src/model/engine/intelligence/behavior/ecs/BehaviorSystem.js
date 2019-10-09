import { System } from "../../../ecs/System.js";
import { BehaviorComponent } from "./BehaviorComponent.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import Clock from "../../../../Clock.js";
import { ClockChannelType } from "./ClockChannelType.js";

export class BehaviorSystem extends System {
    constructor() {
        super();

        this.componentClass = BehaviorComponent;

        this.systemClock = new Clock();
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.systemClock.start();

        super.startup(entityManager, readyCallback, errorCallback);
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.systemClock.stop();

        super.shutdown(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {BehaviorComponent} component
     * @param {number} entity
     */
    link(component, entity) {

        const list = component.list;
        const l = list.length;

        for (let i = 0; i < l; i++) {
            const behavior = list[i];

            if (behavior.getStatus() === BehaviorStatus.Initial) {
                // initialize behavior
                behavior.initialize();
            }
        }
    }

    /**
     *
     * @param {BehaviorComponent} component
     * @param {number} entity
     */
    unlink(component, entity) {

        const list = component.list;
        const l = list.length;

        for (let i = 0; i < l; i++) {
            const behavior = list[i];

            if (behavior.getStatus() === BehaviorStatus.Running) {
                // finalize behavior
                behavior.finalize();
            }
        }
    }

    update(timeDelta) {
        const systemDelta = this.systemClock.getDelta();

        const dataset = this.entityManager.dataset;

        if (dataset === null) {
            //no data
            return;
        }

        /**
         *
         * @param {BehaviorComponent} b
         * @param {number} entity
         */
        function visitBehavior(b, entity) {
            const list = b.list;
            const l = list.length;

            let td;

            if (b.clock === ClockChannelType.Simulation) {
                //use simulation time
                td = timeDelta;
            } else if (b.clock === ClockChannelType.System) {
                //use system clock time delta
                td = systemDelta;
            }

            for (let i = 0; i < l; i++) {
                const behavior = list[i];

                if (behavior.getStatus() !== BehaviorStatus.Running) {
                    continue;
                }


                behavior.tick(td);
            }
        }

        dataset.traverseComponents(BehaviorComponent, visitBehavior);
    }
}
