import { EventType } from "./EntityManager.js";

/**
 *
 * @param {EntityBuilder[]} builders
 * @returns {Promise}
 */
export function whenAllEntitiesDestroyed(builders) {
    return Promise.all(builders.map(whenEntityDestroyed));
}

/**
 *
 * @param {EntityBuilder} builder
 * @returns {Promise}
 */
export function whenEntityDestroyed(builder) {
    return new Promise(function (resolve, reject) {
        builder.addEventListener(EventType.EntityRemoved, resolve);
    });
}