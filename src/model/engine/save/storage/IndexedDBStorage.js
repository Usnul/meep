import Storage from "../Storage.js";
import { IndexedDBTransactionMode } from "./IndexedDBTransactionMode.js";

const MAIN_STORE_NAME = 'main';

export class IndexedDBStorage extends Storage {
    constructor(name) {
        super();

        /**
         *
         * @param {IDBDatabase} database
         */
        function createObjectStore(database) {
            database.createObjectStore(MAIN_STORE_NAME);
        }

        /**
         *
         * @type {Promise<IDBDatabase>}
         */
        this.db = new Promise(function (resolve, reject) {
            const request = indexedDB.open(name, 1);

            request.addEventListener('success', function (event) {
                resolve(request.result);
            });

            request.addEventListener('error', reject);
            request.addEventListener('upgradeneeded', (event) => {
                //upgrade needed
                createObjectStore(event.target.result);
            }, true);
        });

    }

    load(key, resolve, reject, progress) {

        this.db
            .then((db) => {
                const transaction = db.transaction(MAIN_STORE_NAME, IndexedDBTransactionMode.ReadOnly);

                const objectStore = transaction.objectStore(MAIN_STORE_NAME);

                const idbRequest = objectStore.get(key);

                idbRequest.addEventListener('success', (event) => {
                    resolve(event.target.result);
                });

                idbRequest.addEventListener('error', (event) => {
                    reject(event);
                });
            }).catch(reject);
    }

    store(key, value, resolve, reject, progress) {

        const p = this.db
            .then((db) => {
                const transaction = db.transaction(MAIN_STORE_NAME, IndexedDBTransactionMode.ReadWrite);

                const objectStore = transaction.objectStore(MAIN_STORE_NAME);

                const idbRequest = objectStore.put(value, key);

                if (typeof resolve === "function") {

                    idbRequest.addEventListener('success', (event) => {
                        resolve(event.target.result);
                    });

                }

                if (typeof reject === "function") {

                    idbRequest.addEventListener('error', (event) => {
                        reject(event);
                    });

                }
            });

        if (typeof reject === "function") {
            p.catch(reject);
        }
    }

    list(resolve, reject) {
        this.db
            .then((db) => {
                const transaction = db.transaction(MAIN_STORE_NAME, IDBTransaction.READ_ONLY);

                const objectStore = transaction.objectStore(MAIN_STORE_NAME);

                const idbRequest = objectStore.getAllKeys();

                idbRequest.addEventListener('success', (event) => {
                    resolve(event.target.result);
                });

                idbRequest.addEventListener('error', (event) => {
                    reject(event);
                });
            })
            .catch(reject);
    }
}
