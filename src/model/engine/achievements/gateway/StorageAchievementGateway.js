import { AchievementGateway } from "../AchievementGateway.js";
import { noop } from "../../../core/function/Functions.js";

export class StorageAchievementGateway extends AchievementGateway {
    /**
     *
     * @param {Storage} storage
     * @param {String} [key]
     */
    constructor(storage, key = "achievements") {
        super();

        this.storage = storage;

        this.key = key;

        this.last = Promise.resolve();
    }

    getUnlocked() {
        return new Promise((resolve, reject) => {
            this.storage.load(this.key, (list) => {

                if (list === undefined) {
                    resolve([]);
                } else {
                    resolve(list);
                }

            }, reject, noop);
        });
    }

    unlock(id) {
        const storage = this.storage;

        const promise = this.last.finally(() => {
                return new Promise((resolve, reject) => {
                    //read list of unlocked achievements
                    storage.load(this.key, list => {

                        let unlocked;
                        if (list !== undefined) {
                            if (list.includes(id)) {
                                //achievement is already unlocked
                                resolve();
                                return;
                            }

                            unlocked = list.slice();

                        } else {
                            unlocked = []
                        }

                        //modify unlocked achievements
                        unlocked.push(id);

                        //write back
                        storage.store(this.key, unlocked, resolve, reject, noop);
                    }, reject, noop);
                });
            }
        );

        this.last = promise;

        return promise;
    }
}
