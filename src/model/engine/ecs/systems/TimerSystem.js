/**
 * User: Alex Goldring
 * Date: 21/6/2014
 * Time: 14:56
 */
import { System } from '../System';
import Timer from '../components/Timer';


class TimerSystem extends System {
    constructor() {
        super();
        this.componentClass = Timer;
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const dataset = entityManager.dataset;

        if (dataset === null) {
            return;
        }

        dataset.traverseComponents(Timer, function (timer, entity) {
            if (!timer.active) {
                return;
            }

            let budget = timer.counter + timeDelta;
            const timeout = timer.timeout;
            while (budget > timeout) {
                budget -= timeout;

                timer.actions.forEach(function (action) {
                    action();
                });
                entityManager.sendEvent(entity, "timer-timeout", timer);
                if (++timer.ticks > timer.repeat) {
                    //already performed too many cycles
                    timer.active = false;
                    return; //bail out
                }
            }
            timer.counter = budget;

        });

    }
}


export default TimerSystem;
