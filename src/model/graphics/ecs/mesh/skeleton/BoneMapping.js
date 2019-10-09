import { computeCommonPrefix } from "../../../../core/strings/StringUtils.js";
import { HumanoidBoneType } from "./HumanoidBoneType.js";
import levenshtein from 'fast-levenshtein';
import { assert } from "../../../../core/assert.js";

export class BoneMapping {
    constructor() {
        this.mapping = [];
    }

    /**
     *
     * @param {string[]} names
     */
    build(names) {
        //strip common prefix
        const commonPrefix = computeCommonPrefix(names);
        const commonPrefixLength = commonPrefix.length;

        const conditionedNames = names.map(function (name) {
            return name.substring(commonPrefixLength);
        });

        const boneValues = Object.values(HumanoidBoneType);

        //compute probability distribution for each name to a known bone
        const matches = [];

        boneValues.forEach(function (boneName, boneIndex) {

            conditionedNames.forEach(function (name, inputIndex) {
                const distance = levenshtein.get(name, boneName);
                const match = {
                    boneIndex,
                    inputIndex,
                    distance
                };
                matches.push(match);
            });

        });

        //sort distribution according to distance
        matches.sort(function (a, b) {
            return b.distance - a.distance;
        });

        //assign mapping
        let numMatches = matches.length;

        while (numMatches > 0) {
            const match = matches.pop();

            numMatches--;

            const boneIndex = match.boneIndex;
            const inputIndex = match.inputIndex;

            const boneValue = boneValues[boneIndex];

            this.mapping[inputIndex] = boneValue;

            //remove all references to this bone index and input
            for (let i = 0; i < numMatches; i++) {
                const match = matches[i];
                if (match.boneIndex === boneIndex || match.inputIndex === inputIndex) {
                    matches.splice(i, 1);

                    numMatches--;
                    i--;
                }
            }
        }
    }

    /**
     * @param {Bone[]} bones
     */
    apply(bones) {
        assert.ok(Array.isArray(bones), 'bones argument must be an array');

        const numBones = bones.length;

        for (let i = 0; i < numBones; i++) {
            const bone = bones[i];

            const boneType = this.mapping[i];

            bone.boneType = boneType;
        }
    }
}