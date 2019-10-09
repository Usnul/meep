import { create32BitCodec } from "../../../../../core/binary/32BitEncoder.js";

export const BinaryCollectionHeaderCodec = create32BitCodec([1, 15, 16]);
/**
 * @readonly
 * @enum {number}
 */
export const BinaryCollectionHeaderLayout = {
    Dictionary: 0,
    Unused0: 1,
    Version: 2
};
