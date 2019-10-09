import { Asset } from "./Asset.js";
import { AssetManager } from "./AssetManager.js";

function succeedingLoader(path, success, failure, progress) {
    success(new Asset(
        function () {
            return 1;
        },
        0
    ));
}

test('successful get', () => {
    const am = new AssetManager();

    am.registerLoader('a', succeedingLoader);


    return new Promise(function (resolve, reject) {
        am.get('bla', 'a', resolve, reject);
    });
});

test('tryGet loaded resource', async () => {
    const am = new AssetManager();

    am.registerLoader('a', succeedingLoader);

    await am.promise('bla', 'a');

    const asset = am.tryGet('bla', 'a');

    expect(asset).not.toBeNull();
    expect(asset).not.toBeUndefined();
});

