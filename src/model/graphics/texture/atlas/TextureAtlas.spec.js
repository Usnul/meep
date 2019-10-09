import { TextureAtlas } from "./TextureAtlas";
import { Sampler2D } from "../sampler/Sampler2D";
import Vector4 from "../../../core/geom/Vector4";
import { AtlasPatchFlag } from "./AtlasPatchFlag.js";
import { AtlasPatch } from "./AtlasPatch.js";
import { aabb2_overlapExists } from "../../../core/geom/AABB2.js";

expect.extend({
    toBeContainedInAtlas(patch, atlas) {
        const patchX1 = patch.size.x + patch.padding + patch.position.x;
        if (patchX1 > atlas.size.x) {
            return {
                message: `patch endX with padding(=${patchX1}) is greater than atlas width(=${atlas.size.x})`,
                pass: false
            };
        }
        const patchY1 = patch.size.y + patch.padding + patch.position.y;
        if (patchY1 > atlas.size.y) {
            return {
                message: `patch endY with padding(=${patchY1}) is greater than atlas height(=${atlas.size.y})`,
                pass: false
            };
        }

        return {
            pass: true,
            message: `path is contained within the atlas`
        };
    }
});

test("constructor doesn't throw", () => {
    new TextureAtlas();
});


test("packs 1 patch", () => {
    const atlas = new TextureAtlas();
    const patch = atlas.add(Sampler2D.uint8(4, 1, 1), 3);

    atlas.update();

    expect(patch).toBeContainedInAtlas(atlas);

    //expect patch to be both painted and packed
    expect(patch.getFlag(AtlasPatchFlag.Packed)).toBe(true);
    expect(patch.getFlag(AtlasPatchFlag.Painted)).toBe(true);
});

test("snugly packs 16 patches 14x14 with 1px padding into 64x64 atlas", () => {

    const atlas = new TextureAtlas();

    for (let i = 0; i < 16; i++) {
        atlas.add(Sampler2D.uint8(4, 14, 14), 1);
    }

    atlas.update();

    expect(atlas.size.x).toBe(64);
    expect(atlas.size.y).toBe(64);
});

test("build writes 2 patches into atlas", () => {
    const atlas = new TextureAtlas();

    const a = new Sampler2D([1, 2, 3, 4], 4, 1, 1);
    const b = new Sampler2D([5, 6, 7, 8], 4, 1, 1);

    const patchA = atlas.add(a, 1);
    const patchB = atlas.add(b, 1);

    atlas.update();

    const sampler = atlas.sampler;

    const result = new Vector4();
    sampler.get(patchA.position.x, patchA.position.y, result);

    expect(result.toJSON()).toEqual({ x: 1, y: 2, z: 3, w: 4 });

    sampler.get(patchB.position.x, patchB.position.y, result);

    expect(result.toJSON()).toEqual({ x: 5, y: 6, z: 7, w: 8 });
});


test("add method works correctly", () => {
    const atlas = new TextureAtlas();

    const s = Sampler2D.uint8(4, 1, 1);

    const patch = atlas.add(s, 7);

    //check flags
    expect(patch.getFlag(AtlasPatchFlag.Packed)).toBe(false);
    expect(patch.getFlag(AtlasPatchFlag.Painted)).toBe(false);

    //check that sampler has been propagated
    expect(patch.sampler).toBe(s);

    //atlas should be marked as needing update
    expect(atlas.needsUpdate()).toBe(true);

    //atlas contains the patch
    expect(atlas.contains(patch)).toBe(true);
});

test("contains method works correctly", () => {
    const atlas = new TextureAtlas();

    expect(atlas.contains(new AtlasPatch())).toBe(false);

    const s = Sampler2D.uint8(4, 1, 1);

    const patch = atlas.add(s, 7);

    expect(atlas.contains(patch)).toBe(true);

    //remove patch
    atlas.remove(patch);

    expect(atlas.contains(patch)).toBe(false);
});

/**
 *
 * @param {AtlasPatch} patch
 * @param {TextureAtlas} atlas
 * @returns {boolean}
 */
function isPatchDataPainted(patch, atlas) {
    if (!atlas.contains(patch)) {
        return false;
    }

    if (!patch.getFlag(AtlasPatchFlag.Painted)) {
        return false;
    }

    const atlasSample = [];
    const patchSample = [];

    //check data
    for (let i = 0; i < patch.size.x; i++) {
        for (let j = 0; j < patch.size.y; j++) {

            atlas.sampler.get(patch.position.x + i, patch.position.y + j, atlasSample);

            patch.sampler.get(i, j, patchSample);

            for (let k = 0; k < patchSample.length; k++) {
                if (patchSample[k] !== atlasSample[k]) {
                    return false;
                }
            }

        }
    }

    return true;
}

/**
 *
 * @param {AtlasPatch[]} patches
 * @param {TextureAtlas} atlas
 * @returns {boolean}
 */
function isPackingValid(patches, atlas) {
    const patchCount = patches.length;

    for (let i = 0; i < patchCount; i++) {
        const patch0 = patches[i];

        const x0 = patch0.position.x - patch0.padding;
        const y0 = patch0.position.y - patch0.padding;

        const x1 = x0 + patch0.size.x + patch0.padding * 2;
        const y1 = y0 + patch0.size.y + patch0.padding * 2;

        if (x0 < 0) {
            return false;
        }

        if (y0 < 0) {
            return false;
        }

        if (x1 > atlas.size.x) {
            return false;
        }

        if (y1 > atlas.size.y) {
            return false;
        }

        for (let j = i + 1; j < patchCount; j++) {
            const patch1 = patches[j];


            const _x0 = patch1.position.x - patch1.padding;
            const _y0 = patch1.position.y - patch1.padding;

            const _x1 = _x0 + patch1.size.x + patch1.padding * 2;
            const _y1 = _y0 + patch1.size.y + patch1.padding * 2;

            if (aabb2_overlapExists(x0, y0, x1, y1, _x0, _y0, _x1, _y1)) {
                return false;
            }
        }
    }

    return true;
}

test("add 7 patches an update each time", () => {
    const atlas = new TextureAtlas(0);

    const patches = [];

    for (let i = 0; i < 7; i++) {

        const s = Sampler2D.uint8(4, 1, 1);

        s.set(0, 0, [i, i, i, i]);

        const patch = atlas.add(s, 1);

        //check that patch is registered as contained
        expect(atlas.contains(patch));

        //do an update
        atlas.update();

        //verify that patch data is painted propertly
        expect(isPatchDataPainted(patch, atlas)).toBe(true);

        //check that all the other patches are still written properly
        for (let j = 0; j < patches.length; j++) {
            const patch1 = patches[j];

            expect(isPatchDataPainted(patch1, atlas)).toBe(true);
        }

        patches.push(patch);

        //check that there are no overlaps of patches
        expect(isPackingValid(patches, atlas)).toBe(true);
    }

});
