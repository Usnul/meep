/*
File                    odedopri.py

Synopsis
double odedopri(double (*fxy)(double x, double y),
double x0, double y0, double x1, double tol,
    double hmax,  double hmin, int maxiter)

Parameters
fxy               Input: derivative function y' = f(x, y)
y is the dependent variable, x is the independent
variable
x0, y0            Input: initial points, x0 <= x <= x1    y(x0) = y0
x1                Input: final value of x
tol               Input: tolerance
hmax              Input: maximum step size
hmin              Input: minimum step size
maxiter           Input: maximum number of iterations
flag              Input: return flag
0   no errors
1   hmin exceeded
2   maximum iterations exceeded

Return value
value of y at last step x

Description
The routine odedopri() implements the Dormand-Prince method of
solving an ordinary differential equation of the first order
y' = f(x,y).

Reference
The coefficients were obtained from

E.Hairer, S.P.Norsett and G.Wanner[1991],
    "Solving Differential Equations I, Nonstiff Problems",
    2e, Springer-Verlag, p. 178

WARNING
Check the flag after calling this routine!

    Revisions
1998.05.02      first version
2018.05.04      Javascript port from python
@source https://web.archive.org/web/20150907215914/http://adorio-research.org/wordpress/?p=6565
@author ? [original author]
@author Alex Goldring
*/

// we trust that the compiler is smart enough to pre-evaluate the
// value of the constants.
const a21 = (1.0 / 5.0),
    a31 = (3.0 / 40.0),
    a32 = (9.0 / 40.0),
    a41 = (44.0 / 45.0),
    a42 = (-56.0 / 15.0),
    a43 = (32.0 / 9.0),
    a51 = (19372.0 / 6561.0),
    a52 = (-25360.0 / 2187.0),
    a53 = (64448.0 / 6561.0),
    a54 = (-212.0 / 729.0),
    a61 = (9017.0 / 3168.0),
    a62 = (-355.0 / 33.0),
    a63 = (46732.0 / 5247.0),
    a64 = (49.0 / 176.0),
    a65 = (-5103.0 / 18656.0),
    a71 = (35.0 / 384.0),
    a72 = (0.0),
    a73 = (500.0 / 1113.0),
    a74 = (125.0 / 192.0),
    a75 = (-2187.0 / 6784.0),
    a76 = (11.0 / 84.0),

    c2 = (1.0 / 5.0),
    c3 = (3.0 / 10.0),
    c4 = (4.0 / 5.0),
    c5 = (8.0 / 9.0),
    c6 = (1.0),
    c7 = (1.0),

    b1 = (35.0 / 384.0),
    b2 = (0.0),
    b3 = (500.0 / 1113.0),
    b4 = (125.0 / 192.0),
    b5 = (-2187.0 / 6784.0),
    b6 = (11.0 / 84.0),
    b7 = (0.0),

    b1p = (5179.0 / 57600.0),
    b2p = (0.0),
    b3p = (7571.0 / 16695.0),
    b4p = (393.0 / 640.0),
    b5p = (-92097.0 / 339200.0),
    b6p = (187.0 / 2100.0),
    b7p = (1.0 / 40.0);


function StepResult() {
    this.step = 0;
    this.yDelta = 0;
    this.error = 0;
    this.iterations = 0;
}

/**
 *
 * @param {function(x:number, y:number):number} fxy derivative function
 * @param {number} x value of X
 * @param {number} y value of Y
 * @param {number} suggestedStepSize Suggested step size
 * @param {number} tolerance tolerable error size
 * @param {number} maxIterations maximum number of iterations allowed to find step
 * @param {StepResult} result
 * @returns {boolean} true if result is found, false otherwise
 */
function computeStepSize(fxy, x, y, suggestedStepSize, tolerance, maxIterations, result) {
    let i;

    let h = suggestedStepSize;

    for (i = 0; i < maxIterations; i++) {
        /* Compute the function values */
        const K1 = fxy(x, y);
        const K2 = fxy(x + c2 * h, y + h * (a21 * K1));
        const K3 = fxy(x + c3 * h, y + h * (a31 * K1 + a32 * K2));
        const K4 = fxy(x + c4 * h, y + h * (a41 * K1 + a42 * K2 + a43 * K3));
        const K5 = fxy(x + c5 * h, y + h * (a51 * K1 + a52 * K2 + a53 * K3 + a54 * K4));
        const K6 = fxy(x + h, y + h * (a61 * K1 + a62 * K2 + a63 * K3 + a64 * K4 + a65 * K5));
        const K7 = fxy(x + h, y + h * (a71 * K1 + a72 * K2 + a73 * K3 + a74 * K4 + a75 * K5 + a76 * K6));

        const error = Math.abs((b1 - b1p) * K1 + (b3 - b3p) * K3 + (b4 - b4p) * K4 + (b5 - b5p) * K5 + (b6 - b6p) * K6 + (b7 - b7p) * K7);

        // error control
        const delta = 0.84 * Math.pow(tolerance / error, (1.0 / 5.0));

        if (error < tolerance) {
            result.step = h;
            result.error = error;
            result.iterations = i + 1;
            result.yDelta = h * (b1 * K1 + b3 * K3 + b4 * K4 + b5 * K5 + b6 * K6);
            return true;
        }

        if (delta <= 0.1) {
            h = h * 0.1;
        } else if (delta >= 4.0) {
            h = h * 4.0;
        } else {
            h = delta * h;
        }
    }

    //failed to compute step
    return false;
}

/**
 *
 * @param {function(x:number, y:number):number} fxy derivative function
 * @param {number} x0 starting X value
 * @param {number} y0 starting Y value
 * @param {number} x1 end X value
 * @param {number} tol tolerance
 * @param {number} hmax max step size
 * @param {number} hmin min step size
 * @param {number} maxiter maximum number of iterations
 * @returns {*[]}
 */
function odedopri(fxy, x0, y0, x1, tol, hmax, hmin, maxiter) {


    let x = x0;
    let y = y0;
    //step size
    let h = hmax;

    let flag;
    const stepResult = new StepResult();
    while (maxiter > 0) {
        maxiter--;
        if (computeStepSize(fxy, x, y, h, tol, 100, stepResult)) {
            h = stepResult.step;
            x += h;
            y += stepResult.yDelta;
        } else {
            //failed to find a good step, take a conservative smallest possible step
            h = hmin;
        }

        if (h > hmax) {
            h = hmax;
        }


        if (x >= x1) {
            flag = 0;
            break;
        } else if (x + h > x1) {
            h = x1 - x;
        } else if (h < hmin) {
            h = hmin;
        }
    }

    if (maxiter <= 0) {
        flag = 2;
    }

    return [y, x, flag, maxiter];
}

function main() {
    function fxy(x, y) {
        return Math.abs(Math.sin(x));
    }

    const x0 = 0,
        y0 = 1.24,
        x1 = 1000.0,
        tol = 1.0e-5,
        hmax = 1.0,
        hmin = 0.001,
        maxiter = 1000000;

    console.log(odedopri(fxy, x0, y0, x1, tol, hmax, hmin, maxiter));
}

console.time('solver');
main();
console.timeEnd('solver');

export {
    StepResult,
    computeStepSize
};