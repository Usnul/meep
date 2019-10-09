import { EntityManager } from "./EntityManager.js";
import { System } from "./System.js";

/**
 *
 * @returns {Promise<EntityManager>}
 */
function makeEm(systems = []) {
    const em = new EntityManager();

    //add systems
    systems.forEach(s => em.addSystem(s));

    return new Promise(function (resolve, reject) {
        //startup
        em.startup(function () {
            resolve(em);
        }, reject);
    });
}

function DummyComponent() {
}

class DummySystem extends System {
    constructor() {
        super();

        this.componentClass = DummyComponent;

    }

}

test("constructor doesn't throw", () => {
    expect(() => new EntityManager()).not.toThrow();
});

test("startup with no systems without errors", () => {
    const em = new EntityManager();

    return new Promise(function (resolve, reject) {
        //startup
        em.startup(resolve, reject);
    });
});

test("startup/shutdown with no systems without errors", async () => {
    const em = new EntityManager();

    await new Promise(function (resolve, reject) {
        //startup
        em.startup(resolve, reject);
    });

    await new Promise(function (resolve, reject) {
        //shutdown
        em.shutdown(resolve, reject)
    });
});

test("startup/shutdown with dummy systems without errors", async () => {
    const em = new EntityManager();

    const dummySystem = new DummySystem();

    const systemStartup = jest.spyOn(dummySystem, 'startup');
    const systemShutdown = jest.spyOn(dummySystem, 'shutdown');

    em.addSystem(dummySystem);

    await new Promise(function (resolve, reject) {
        //startup
        em.startup(resolve, reject);
    });

    expect(systemStartup).toHaveBeenCalledTimes(1);
    expect(systemShutdown).not.toHaveBeenCalled();

    await new Promise(function (resolve, reject) {
        //shutdown
        em.shutdown(resolve, reject)
    });

    expect(systemStartup).toHaveBeenCalledTimes(1);
    expect(systemShutdown).toHaveBeenCalledTimes(1);
});

test("call to 'simulate' propagate to registered system", () => {
    const dummySystem = new DummySystem();
    const update = jest.spyOn(dummySystem, 'update');

    return makeEm([dummySystem])
        .then((em) => {
            em.simulate(7);

            expect(update).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenLastCalledWith(7);
        });
});
