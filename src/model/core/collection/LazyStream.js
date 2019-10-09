/**
 * @template A,B
 * @param {A[]} source
 * @param {function(A,index:number):B} transformer
 * @returns {B[]}
 */
export function lazyArrayMap(source, transformer) {
    return new Proxy(source, {
        get(target, p, receiver) {
            if (/^([0-9]+)$/.test(p)) {

                const targetElement = target[p];

                const resultElement = transformer(targetElement, p);

                return resultElement;
            } else {

                return target[p];
            }
        }
    });
}