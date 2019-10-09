/**
 * Created by Alex on 30/10/2014.
 */
import QuadTree from '../../../core/geom/2d/quad-tree/PointQuadTree';
import AABB2 from '../../../core/geom/AABB2';
import { seededRandom } from '../../../core/math/MathUtils';
import { makeRangedRandom } from "../../../core/math/MathUtils.js";


const Point2 = function (x, y) {
    this.x = x;
    this.y = y;
};


function makeFalse() {
    return false;
}

/**
 *
 * @param {function():number} random returns a number between 0 and 1
 * @param {AABB2} mask
 * @param {Vector2} size
 * @param {number} count
 * @param {function(u:number, v:number):number} callback return value controls how many more samples to add
 */
function traverseMask(random, mask, size, count, callback) {

    const uRandom = makeRangedRandom(random, mask.x0 / size.x, mask.x1 / size.x);
    const vRandom = makeRangedRandom(random, mask.y0 / size.y, mask.y1 / size.y);

    for (let i = 0; i < count; i++) {
        const u = uRandom();
        const v = vRandom();

        const extraSampleCount = callback(u, v);

        i -= extraSampleCount;
    }
}

/**
 * @property {AABB2} mask
 * @property {PointQuadTree} quadTree
 * @constructor
 */
const SampleTraverser = function () {
    const self = this;
    this.resolveSpace = false;
    this.resolveSpaceSizeMin = 0;
    this.quadTree = void 0;

    this.mask = new AABB2(0, 0, 1, 1);

    const random = seededRandom(1);

    //


    /**
     *
     * @param {Sampler2D} densityMap
     * @param {number} density
     * @param {Vector2} size
     * @param {function(u:number, v:number):void} visitorFunction
     */
    function traverseSamples(densityMap, density, size, visitorFunction) {
        let rejectSample = false;
        let numRejectedSamples = 0;

        function spaceCheck() {
            numRejectedSamples++;
            rejectSample = true;
        }

        const width = size.x;
        const height = size.y;
        let quadTree;
        const resolveSpace = self.resolveSpace;

        let resolveSpaceInsert;

        if (resolveSpace) {
            //convert size to normalized X,Y dimensions
            const uvUnitWidth_2 = 0.5 / width;
            const uvUnitHeight_2 = 0.5 / height;
            //
            if (self.quadTree === void 0) {
                quadTree = new QuadTree(0, 0, 1, 1);
            } else {
                quadTree = self.quadTree;
            }
            resolveSpaceInsert = function (u, v, sampleSize) {
                rejectSample = false;
                const width = sampleSize * uvUnitWidth_2;
                const height = sampleSize * uvUnitHeight_2;
                quadTree.traverseRect(u - width, v - height, u + width, v + height, spaceCheck);
                //
                if (rejectSample) {
                    return true;
                }
                quadTree.insert(new Point2(u, v));

                return false;
            };
        } else {
            resolveSpaceInsert = makeFalse;
        }

        const mask = self.mask;


        const count = density * mask.getWidth() * mask.getHeight();

        let samplesPlaced = 0;
        //
        const sampleSizeMin = self.resolveSpaceSizeMin;
        const sampleSizeRange = (self.resolveSpaceSizeMax - self.resolveSpaceSizeMin);

        function pickSampleSize() {
            return sampleSizeMin + random() * sampleSizeRange;
        }

        let rejectedSampleBudget = count * 0.2;

        traverseMask(random, mask, size, count, function (u, v) {

            //check tap against density map
            const densityValue = densityMap.sample(u, v);
            if (densityValue === 0) {
                //0 chance
                return 0;
            }
            const densityRoll = random();
            if (densityRoll > densityValue) {
                //probability roll against density value failed
                return 0;
            }
            const sampleSize = pickSampleSize();
            const spaceResolutionCheck = resolveSpaceInsert(u, v, sampleSize);
            if (spaceResolutionCheck === true) {
                //reject sample
                if (rejectedSampleBudget-- > 0) {
                    return 1;
                } else {
                    //skip sample
                    return 0;
                }
            }
            samplesPlaced++;
            visitorFunction(u, v, sampleSize);

            return 0;
        });

        // console.log(numRejectedSamples, " samples rejected, ", samplesPlaced, " samples placed, tries: ", count);
    }

    this.traverse = traverseSamples;
};

SampleTraverser.traverseMask = traverseMask;

export default SampleTraverser;
