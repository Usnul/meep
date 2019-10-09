import { RandomOptimizer } from "./RandomOptimizer.js";

test("sort optimization", () => {
    /**
     *
     * @type {RandomOptimizer<number[]>}
     */
    const op = new RandomOptimizer();

    op.initialize({
        state: [5, 4, 3, 2, 1],
        computeValidActions(s) {
            const result = [];

            const l = s.length;

            for (let i = 0; i < l; i++) {
                for (let j = i + 1; j < l; j++) {

                    const i0 = i;
                    const i1 = j;

                    result.push(function (s) {
                        const temp = s[i0];

                        s[i0] = s[i1];
                        s[i1] = temp;
                    });
                }
            }

            return result;
        },
        cloneState(s) {
            return s.slice();
        },
        scoreFunction(s) {
            let r = 0;

            for (let i = 0; i < s.length; i++) {
                const e = s[i];

                r += i * e;
            }

            return r;
        }
    });

    for (let i = 0; i < 1000; i++) {
        if (!op.stepThrough(100)) {
            break;
        }
    }

    expect(op.state).toEqual([1, 2, 3, 4, 5]);
});
