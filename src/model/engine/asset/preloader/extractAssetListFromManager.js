
import { GameAssetType } from "../GameAssetType.js";

/**
 *
 * @param {AssetManager} assetManager
 */
export function extractAssetListFromManager(assetManager) {
    const DEFAULT_LEVEL = 3;

    const LEVEL_BY_TYPE = {
        [GameAssetType.DeferredTexture]: 3,
        [GameAssetType.Texture]: 3,
        [GameAssetType.ImageSvg]: 3,
        [GameAssetType.Image]: 3,
        [GameAssetType.JSON]: 1,
        [GameAssetType.ArrayBuffer]: 1,
        [GameAssetType.ModelThreeJs]: 2,
        [GameAssetType.ModelGLTF_JSON]: 2,
        [GameAssetType.ModelGLTF]: 2
    };

    function getLevel(type) {
        const level = LEVEL_BY_TYPE[type];
        if (level === undefined) {
            return DEFAULT_LEVEL;
        } else {
            return level;
        }
    }

    const result = [];

    /**
     *
     * @param {Asset} asset
     * @param {AssetDescription} assetDescription
     */
    function visitAssetEntry(asset, assetDescription) {
        const type = assetDescription.type;

        const level = getLevel(type);

        const uri = assetDescription.path;

        result.push({
            uri,
            type,
            level
        });
    }

    assetManager.assets.forEach(visitAssetEntry);

    return result;
}