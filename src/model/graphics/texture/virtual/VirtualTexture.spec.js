import { VirtualTexture } from "./VirtualTexture";
import Vector2 from "../../../core/geom/Vector2";

function mockAssetManager() {
    const assetManager = {
        get: function (path, type, success, failure) {
            const delay = Math.random() * 100;
            setTimeout(function () {
                success({
                    create: function () {
                        return null;
                    }
                });
            }, delay);
        }
    };

    return assetManager;
}

test("constructor doesn't throw", () => {
    const assetManager = mockAssetManager();

    new VirtualTexture({ assetManager })
});

test("init computes sizes correctly", () => {
    const assetManager = mockAssetManager();

    const sut = new VirtualTexture({ assetManager });

    sut.init({ padding: 4, resolution: new Vector2(16, 3), tileResolution: new Vector2(1, 1) });

    expect(sut.maxMipLevel).toBe(4);

    expect(sut.sizeInTiles.x).toBe(16);
    expect(sut.sizeInTiles.y).toBe(3);
});