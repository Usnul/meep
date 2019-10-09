import { Matrix4, NormalBlending, ShaderMaterial, Vector2, Vector4 } from "three";

/**
 Shader for drawing fog of war as a screen-space post-process effect
 @returns {ShaderMaterial}
 */
export function buildScreenSpaceFogOfWarShader() {
    function vertexShader() {
        return `        
        varying vec2 vUv;

        void main() {

            vUv = uv;
                
            gl_Position = vec4( (uv - 0.5)*2.0, 0.0, 1.0 );
            
        }`;
    }

    function fragmentShader() {
        return `
        #include <packing>
        uniform sampler2D tDepth;
        uniform sampler2D tFog; 
        uniform vec4 uFogUvTransform;
        
        uniform mat4 uProjectionInverse;
        uniform mat4 uViewInverse;
        uniform vec2 uResolution;
                
        uniform vec4 uColor;
        
        varying vec2 vUv;
        
	     vec3 computeWorldPosition(){
                // Convert screen coordinates to normalized device coordinates (NDC)
                
                float normalizedDepth = texture2D( tDepth, vUv).x ; 
                
                vec4 ndc = vec4(
                    (vUv.x - 0.5) * 2.0,
                    (vUv.y - 0.5) * 2.0,
                    (normalizedDepth - 0.5) * 2.0,
                    1.0);
                
                vec4 clip = uProjectionInverse * ndc;
                vec3 result = (uViewInverse* (clip / clip.w) ).xyz;
                
                return result;
	     }
	     
	     
	     float sampleFog(const in vec2 uv){
	       return texture2D( tFog, uv ).r;
	     }
	     
	     float getFog(const in vec2 uv){
	         vec2 texelSize = vec2( 1.0 ) / uResolution;
	        
	        float r = 1.0;
	        
	        float dx0 = - texelSize.x * r;
			float dy0 = - texelSize.y * r;
			float dx1 = + texelSize.x * r;
			float dy1 = + texelSize.y * r;
			
			return (
				sampleFog( uv.xy + vec2( dx0, dy0 ) ) +
				sampleFog( uv.xy + vec2( 0.0, dy0 ) ) +
				sampleFog( uv.xy + vec2( dx1, dy0 ) ) +
				sampleFog( uv.xy + vec2( dx0, 0.0 ) ) +
				sampleFog( uv.xy) +
				sampleFog( uv.xy + vec2( dx1, 0.0 ) ) +
				sampleFog( uv.xy + vec2( dx0, dy1 ) ) +
				sampleFog( uv.xy + vec2( 0.0, dy1 ) ) +
				sampleFog( uv.xy + vec2( dx1, dy1 ) )
			) * ( 1.0 / 9.0 );
	     }
	     	        
        void main(){
                //get world fragment position
                vec3 worldPosition = computeWorldPosition();
                
                vec2 fogUv = worldPosition.xz * uFogUvTransform.zw + uFogUvTransform.xy;
                
                float fogValue = getFog( fogUv );
                
                gl_FragColor = vec4(1.0, 1.0, 1.0, fogValue) * uColor;
        }
        `;
    }

    const uniforms = {
        tFog: {
            type: 't',
            /**
             * @type {Texture}
             */
            value: null
        },
        tDepth: {
            type: 't',
            /**
             * @type {Texture}
             */
            value: null
        },
        uViewInverse: { type: 'm4', value: new Matrix4() },
        uProjectionInverse: { type: 'm4', value: new Matrix4() },
        uColor: { type: 'c', value: new Vector4(0, 0, 0, 1) },
        uFogUvTransform: { type: 'v4', value: new Vector4(0, 0, 1, 1) },
        uResolution: { type: 'v2', value: new Vector2(0, 0) }
    };

    const material = new ShaderMaterial({
        uniforms,
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        vertexColors: false,
        extensions: {}
    });

    return material;
}