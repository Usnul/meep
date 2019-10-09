/**
 * Created by Alex on 12/08/2014.
 */
import { System } from '../System';
import Transform from '../components/Transform';
import MonsterAI from '../components/MonsterAI';
import Tag from '../components/Tag';
import PathFollower from '../../../navigation/ecs/components/PathFollower';
import Steering from '../components/Steering';
import Attacker from '../components/Attacker';


class MonsterAISystem extends System {
    constructor(pathFinder) {
        super();
        this.pathFinder = pathFinder;
        this.componentClass = MonsterAI;
    }

    add(component, entity) {
        const pathFinder = this.pathFinder;
        const em = this.entityManager;
        em.addEntityEventListener(entity, "spawned", function () {
            //reset current path
            const pf = em.getComponent(entity, PathFollower);
            pf.path = null;
            gotoDefensePoint(em, pathFinder, entity);
        });
    }

    remove(component) {
    }

    update(timeDelta) {
        const em = this.entityManager;
        const pathFinder = this.pathFinder;
        em.traverseEntities([MonsterAI, Attacker, Transform], function (ai, attacker, transform, entity) {
            const target = attacker.target;
            if (target !== null) {
                //there is a target
                const targetTransform = em.getComponent(target, Transform);
                if (targetTransform === null) {
                    gotoDefensePoint(em, pathFinder, entity);
                    return;
                }
                //check the distance
                const distance = transform.position.distanceTo(targetTransform.position);
                if (distance <= ai.chaseDistance) {
                    //check if path exists
                    pathFinder.findPath(transform.position, targetTransform.position, 2, function (path) {
                        //find length of the path
                        if (path !== null && pathLength(path) < ai.chaseDistance) {
                            const pathFollower = em.getComponent(entity, PathFollower);
                            if (pathFollower !== null) {
                                pathFollower.path = path;
                                pathFollower.lastIndex = 0;
                                //stop steering
                                const steering = em.getComponent(entity, Steering);
                                steering.destination = null;
                            }
                        } else {
                            gotoDefensePoint(em, pathFinder, entity);
                        }
                    });
                } else {
                    gotoDefensePoint(em, pathFinder, entity);
                }
            }
        });
    }
}


function pointsEqual(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y && p1.z === p2.z;
}

function navigateTo(em, entity, target, pathFinder) {
    const pathFollower = em.getComponent(entity, PathFollower);
    const steering = em.getComponent(entity, Steering);
    const source = em.getComponent(entity, Transform);

    //check if already going to the right place
    const path = pathFollower.path;
    let pathLength;
    if (path !== null && path !== void 0 && (pathLength = path.length, pathLength > 0)) {
        const lastPointOfPath = path[pathLength - 1];
        if (pointsEqual(lastPointOfPath, target.position)) {
            return;// already following thr right path
        }
    }

    //find new path
    if (target !== null && !pathFollower.lock) {
        pathFollower.lock = true;
        pathFinder.findPath(source.position, target.position, 2, function (path) {
            //reset path
            pathFollower.path = path;
            pathFollower.lastIndex = 0;
            //stop steering
            steering.destination = null;
            //release lock
            pathFollower.lock = false;
        });
    }
}

/**
 * finds nearest (straight line distance) entity with matching tag and navigates to it
 * @param em
 * @param pathFinder
 * @param entity
 * @param tagName
 */
function gotoTag(em, pathFinder, entity, tagName) {
    let target = null;
    let d = Math.POSITIVE_INFINITY;
    const sourceTransform = em.getComponent(entity, Transform);
    const sourcePosition = sourceTransform.position;
    em.traverseEntities([Tag, Transform], function (tag, transform) {
        if (tag.name === tagName) {
            const distanceToSquared = transform.position.distanceToSquared(sourcePosition);
            if (target === null || distanceToSquared < d) {
                target = transform;
                d = distanceToSquared;
            }
        }
    });
    navigateTo(em, entity, target, pathFinder);
}

function pathLength(path) {
    let result = 0;
    if (path === void 0) {
        return 0;
    }
    const l = path.length - 1;
    if (l >= 1) {
        let c = path[0], p;
        for (let i = 1; i < l; i++) {
            p = c;
            c = path[i];
            result += p.distanceTo(c);
        }
    }
    return result;
}

function gotoDefensePoint(entityManager, pathFinder, entity) {

    gotoTag(entityManager, pathFinder, entity, "DefensePoint");
}

export default MonsterAISystem;
