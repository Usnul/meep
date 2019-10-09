import { CubeReflectionMapping, ImageUtils, RGBFormat } from 'three';

function loadCubeTexture(folder, format, names) {
    if (format === void 0) {
        format = "png";
    }
    const defaultNames = {
        yPositive: "posy",
        yNegative: "negy",
        xPositive: "posx",
        xNegative: "negx",
        zPositive: "posz",
        zNegative: "negz"
    };
    names = names !== void 0 ? names : defaultNames;
    const r = folder + "/";
    const urls = [
        r + names.xPositive + "." + format,
        r + names.xNegative + "." + format,
        r + names.yPositive + "." + format,
        r + names.yNegative + "." + format,
        r + names.zPositive + "." + format,
        r + names.zNegative + "." + format
    ];

    const textureCube = ImageUtils.loadTextureCube(urls);
    textureCube.format = RGBFormat;
    textureCube.mapping = CubeReflectionMapping;
    return textureCube;
}

export default loadCubeTexture;