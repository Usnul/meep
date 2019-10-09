/**
 * @template R
 * @param {R[]} result
 * @param {Iterator<R>} iterator
 */
export function collectIteratorValueToArray(result, iterator) {

    for (let it = iterator.next(); !it.done; it = iterator.next()) {
        result.push(it.value);
    }

}
