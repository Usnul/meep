/**
 * Created by Alex on 10/11/2014.
 */


//var current = getValue(x, y);
////
//var top = getValue(x, y - 1);
//var bottom = getValue(x, y + 1);
//var left = getValue(x - 1, y);
//var right = getValue(x + 1, y);
////
//var topLeft = getValue(x - 1, y - 1);
//var topRight = getValue(x + 1, y - 1);
//var bottomLeft = getValue(x - 1, y + 1);
//var bottomRight = getValue(x + 1, y + 1);
////
//var xm = (right - current) + (current - left) + (topRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (bottomRight - current) / sqrt2 + (current - bottomLeft) / sqrt2;
//var ym = (bottom - current) + (current - top) + (bottomLeft - current) / sqrt2 + (bottomRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (current - topRight) / sqrt2;
//if (Number.isNaN(xm)) {
//    xm = 0;
//}
//if (Number.isNaN(ym)) {
//    ym = 0;
//}
//xm /= 6;
//ym /= 6;
//var f = Math.sqrt(xm * xm + ym * ym);
//var a = Math.acos(f);
//var d = Math.sin(a);
//result.set(xm, ym, d);
//result.normalize();
import * as THREE from 'three';

const NormalMapShader = function () {
    return {

        uniforms: {

            "heightMap": { type: "t", value: null },
            "resolution": { type: "v2", value: new THREE.Vector2(512, 512) },
            "scale": { type: "v2", value: new THREE.Vector2(1, 1) },
            "height": { type: "f", value: 0.05 }

        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),

        fragmentShader: [

            "uniform float height;",
            "uniform vec2 resolution;",
            "uniform sampler2D heightMap;",

            "#define sqrt2 1.41421356237;",

            "varying vec2 vUv;",

            "void main() {",
            "   float uStep = 1.0/resolution.x;",
            "   float vStep = 1.0/resolution.y;",
            //
            "   float current = texture2D( heightMap, vUv ).x;",
            //
            "   float top = texture2D( heightMap, vUv + vec2(0, -vStep)).x;",
            "   float bottom = texture2D( heightMap, vUv + vec2(0, +vStep)).x;",
            "   float left = texture2D( heightMap, vUv + vec2(-uStep, 0)).x;",
            "   float right = texture2D( heightMap, vUv + vec2(+uStep, 0)).x;",
            //
            "   float topLeft = texture2D( heightMap, vUv + vec2(-uStep, -vStep)).x;",
            "   float topRight = texture2D( heightMap, vUv + vec2(uStep, -vStep)).x;",
            "   float bottomLeft = texture2D( heightMap, vUv + vec2(-uStep, vStep)).x;",
            "   float bottomRight = texture2D( heightMap, vUv + vec2(uStep, vStep)).x;",
            //////
            //"   float xm = (right - current) + (current - left) + (topRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (bottomRight - current) / sqrt2 + (current - bottomLeft) / sqrt2;",
            //"   float ym = (bottom - current) + (current - top) + (bottomLeft - current) / sqrt2 + (bottomRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (current - topRight) / sqrt2;",
            //////
            //"   xm = xm/6.0;",
            //"   ym = ym/6.0;",
            //////
            //"   float f = sqrt(xm*xm + ym*ym);",
            //"   float a = acos(f);",
            //"   float d = sin(a);",
            //
            //"   vec3 n = normalize( vec3( xm, ym, d  ) );",
            ////
            //"vec3 va =  vec3(uStep, 0.0, -xm) ;",
            //"vec3 vb =  vec3(0.0, vStep, ym);",
            //"vec3 n = normalize(cross(va,vb));",
            //sobel filter
            "   float dX = (topRight + 2.0 * right + bottomRight) - (topLeft + 2.0 * left + bottomLeft);",
            "   float dY = (bottomLeft + 2.0 * bottom + bottomRight) - (topLeft + 2.0 * top + topRight);",
            "   float dZ = 0.5;",
            "   vec3 n = normalize(vec3(dX, dY, dZ));",

            "   gl_FragColor = vec4( n*0.5+0.5, 1.0 );",

            "}"

        ].join('\n')

    }
};
export default NormalMapShader;
