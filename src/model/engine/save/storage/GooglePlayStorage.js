/**
 * Created by Alex on 22/02/2017.
 */

import Storage from '../Storage';

class GooglePlayStorage extends Storage {
    constructor(gapi) {
        super();
        if (typeof gapi.client.games !== "object") {
            gapi.client.load('games', 'v1', function (response) {
                console.log('loaded google games API');
            });
        }
        this.api = gapi;
    }

    store(key, value, resolve, reject, progress) {
        this.api.client.request({
            path: '/games/v1/snapshots',
            params: {
                snapshotId: key
            },
            method: "put",
            body: value
        }).then(function (r) {
            console.log(r);
        });
    }

    load(key, resolve, reject, progress) {
        this.api.client.games.snapshots.get(key, function (r) {
            console.log("Snapshot loaded", r);
            resolve(r);
        });
    }

    list(keyRead) {
        this.api.client.games.snapshots.list({
            playerId: "me"
        }, function (r) {
            console.log("Snapshot list obtained", r);
        });
    }
}

export default GooglePlayStorage;