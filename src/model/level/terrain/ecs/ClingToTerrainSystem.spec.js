import ClingToTerrainSystem from "./ClingToTerrainSystem";
import { EntityManager } from "../../../engine/ecs/EntityManager";
import TransformSystem from "../../../engine/ecs/systems/TransformSystem";


function createEm() {

    const manager = new EntityManager();

    manager.addSystem(new TransformSystem());

    return manager;
}

test('startup finishes successfully', () => {
    const sut = new ClingToTerrainSystem();

    const manager = createEm();

    manager.addSystem(sut);

    return new Promise(function (resolve, reject) {
        manager.startup(resolve, reject);
    })
});


test('shutdown finishes successfully', () => {
    const sut = new ClingToTerrainSystem();

    const manager = createEm();

    manager.addSystem(sut);

    return new Promise(function (resolve, reject) {
        manager.startup(resolve, reject);
    }).then(function () {
        return new Promise(function (resolve, reject) {
            manager.shutdown(resolve, reject);
        });
    });
});