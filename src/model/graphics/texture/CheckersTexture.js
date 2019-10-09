/**
 * Created by Alex on 22/05/2016.
 */
import { NearestFilter, RepeatWrapping, TextureLoader } from 'three';
import checkersURI from './CheckersTextureURI';

/**
 *
 * @param {Vector2} [repeat]
 * @returns {Texture}
 */
function make(repeat) {
    const checkerTexture = (new TextureLoader()).load(checkersURI);
    checkerTexture.magFilter = NearestFilter;

    if (repeat !== undefined) {
        checkerTexture.wrapS = RepeatWrapping;
        checkerTexture.wrapT = RepeatWrapping;

        checkerTexture.repeat.copy(repeat);
    }
    
    return checkerTexture;
}

export default {
    create: make
};