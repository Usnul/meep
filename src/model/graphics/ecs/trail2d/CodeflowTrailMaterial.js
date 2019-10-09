/**
 * Borrowed from https://github.com/pyalot/webgl-trails
 * Created by Alex on 14/06/2017.
 * @author Alex Goldring
 * @author pyalot
 */


import { DoubleSide, NormalBlending, ShaderMaterial, Vector2, Vector4 } from 'three';

const vertexShader = `
    varying vec2 vUv;
    varying float vOpacity;

    attribute vec3 last, next;
    attribute float off;
    attribute float uvOffset;
    attribute float creationTime;

    uniform vec2 viewport;
    uniform float width;
    uniform float maxAge;
    uniform float time;
    
    float pi = 3.141592653589793;

    vec4 transform(vec3 coord){
        return projectionMatrix * modelViewMatrix * vec4(coord, 1.0);
    }

    vec2 project(vec4 device){
        vec3 device_normal = device.xyz/device.w;
        vec2 clip_pos = (device_normal*0.5+0.5).xy;
        return clip_pos * viewport;
    }

    vec4 unproject(vec2 screen, float z, float w){
        vec2 clip_pos = screen/viewport;
        vec2 device_normal = clip_pos*2.0-1.0;
        return vec4(device_normal*w, z, w);
    }

    float estimateScale(vec3 position, vec2 sPosition){
        vec4 view_pos = modelViewMatrix * vec4(position, 1.0);
        float halfWidth = width*0.5;
        vec4 scale_pos = view_pos - vec4(normalize(view_pos.xy)*halfWidth, 0.0, 0.0);
        vec2 screen_scale_pos = project(projectionMatrix * scale_pos);
        return distance(sPosition, screen_scale_pos);
    }

    float curvatureCorrection(vec2 a, vec2 b){
        float p = a.x*b.y - a.y*b.x;
        float c = atan(p, dot(a,b))/pi;
        return clamp(c, -1.0, 1.0);
    }

    void main(){
        vec2 sLast = project(transform(last.xyz));
        vec2 sNext = project(transform(next.xyz));

        vec4 dCurrent = transform(position.xyz);
        vec2 sCurrent = project(dCurrent);

        vec2 normal1 = normalize(sLast - sCurrent);
        vec2 normal2 = normalize(sCurrent - sNext);
        vec2 normal = (normal1 + normal2)*0.5;
        vUv = vec2(uvOffset*0.7, off*0.5+0.5);
        
        float age = clamp((time - creationTime)/maxAge, 0.0, 1.0);
        vOpacity = 1.0-age;       
        
        vec2 dir = vec2(normal.y, -normal.x)*off;
        
        float scale = estimateScale(position.xyz, sCurrent);
        vec2 pos = sCurrent + dir*scale;

        gl_Position = unproject(pos, dCurrent.z, dCurrent.w);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    varying float vOpacity;
    uniform vec4 color;

    uniform sampler2D uTexture;
    
    void main(){
        vec4 diffuseColor = color;
        diffuseColor.a *= vOpacity;
        
        #ifdef USE_TEXTURE
            vec4 texel = texture2D(uTexture, vUv);
            diffuseColor *= texel;
        #endif
        
        gl_FragColor = diffuseColor;
    }
`;

function CodeflowMaterial() {
    const uniforms = {
        uTexture: { type: "t", value: null },
        viewport: { type: "v2", value: new Vector2(800, 600) },
        width: { type: "f", value: 5 },
        time: { type: "f", value: 0 },
        maxAge: { type: "f", value: 1 },
        color: { type: "v4", value: new Vector4(1, 1, 1, 1) }
    };

    const side = DoubleSide;

    const shaderMaterial = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: side,
        blending: NormalBlending,
        lights: false,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        defines: {
            USE_TEXTURE: false
        }
    });

    shaderMaterial.needsUpdate = true;

    //shaderMaterial.defaultAttributeValues.tangent = [0, 1, 0];
    return shaderMaterial;
}

export default CodeflowMaterial;
