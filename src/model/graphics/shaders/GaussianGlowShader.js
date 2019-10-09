/**
 * Created by Alex on 20/09/2015.
 */
import { Vector2 } from 'three';

const GaussianGlowShader = {

    defines: {},

    uniforms: {

        "tDiffuse": { type: "t", value: null },
        "resolution": { type: "v2", value: new Vector2(800, 600) },
        "sigma": { type: "v2", value: new Vector2(15, 15) }
    },

    vertexShader: [

        "varying vec2 vUv;",

        "void main() {",

        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join("\n"),
    fragmentShader: [
        "const int   c_samplesX    = 5;",  // must be odd
        "const int   c_samplesY    = 5;",  // must be odd

        "const int   c_halfSamplesX = c_samplesX / 2;",
        "const int   c_halfSamplesY = c_samplesY / 2;",

        "const float radius = 6.0;",
        "const vec2 samplingBias = vec2(float(c_halfSamplesX),float(c_halfSamplesY))/radius;",

        "uniform vec2 resolution;",
        "uniform vec2 sigma;",
        "uniform sampler2D tDiffuse;",
        "varying vec2 vUv;",

        "float Gaussian (float sigma, float x){",
        "    return exp(-(x*x) / (2.0 * sigma*sigma));",
        "}",

        "vec4 BlurredPixel (in vec2 uv){",

        "    float total = 0.0;",
        "    vec4 ret = vec4(0.0);",
        "    vec2 sampleResolution = resolution*samplingBias;",

        "    for (int iy = 0; iy < c_samplesY; ++iy){",
        "        float fy = Gaussian (sigma.y, float(iy) - float(c_halfSamplesY));",
        "        float offsety = float(iy-c_halfSamplesY) / sampleResolution.y;",
        "        for (int ix = 0; ix < c_samplesX; ++ix){",
        "            float fx = Gaussian (sigma.x, float(ix) - float(c_halfSamplesX));",
        "            float offsetx = float(ix-c_halfSamplesX) / sampleResolution.x;",
        "            total += fx * fy;",
        "            ret += texture2D(tDiffuse, uv + vec2(offsetx, offsety)) * fx*fy;",
        "        }",
        "    }",
        "    return ret*1.7 / total;",
        "}",

        "void main() {",
        "   if(texture2D(tDiffuse, vUv).a > 0.0){",
        "       gl_FragColor = vec4(0.0);",
        "   }else{",
        "       gl_FragColor = BlurredPixel(vUv);",
        "       if(gl_FragColor.a < 0.01){ ",
        "           gl_FragColor = vec4(0.0);",
        "       }",
        "   }",

        "}"


    ].join("\n")
};

export default GaussianGlowShader;