/**
 * Created by Alex on 11/08/2014.
 */
import { System } from '../../../engine/ecs/System';
import Transform from '../../../engine/ecs/components/Transform';
import PathFollower from '../components/PathFollower';
import PathFinder from '../components/PathFinder';
import Navigator from '../../PathFinder';
import Path from '../../Path';


class PathFinderSystem extends System {
    constructor() {
        super();
        this.componentClass = PathFinder;
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;
        this.navigator = new Navigator();
    }

    add(component, entity) {
    }

    remove(component) {
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const nav = this.navigator;
        entityManager.traverseEntities([PathFinder, PathFollower, Transform], function (finder, follower, transform, entity) {
            const desination = finder.desination;
            if (finder.finding === false) {
                const target = follower.path.last();
                if (target !== desination) {
                    finder.finding = true;
                    //find path
                    nav.findPath(transform.position, desination, 2, function (path) {
                        finder.finding = false;
                        follower.path = new Path(path);
                        finder.destination = follower.path.last();
                    });
                }
            }
        });
    }
}


export default PathFinderSystem;
