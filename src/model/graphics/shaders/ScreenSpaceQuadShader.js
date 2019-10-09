function vertexShader() {
    return `
                varying vec2 vUv;
        
                void main() {
        
                    vUv = uv;
                    gl_Position = vec4( (uv - 0.5)*2.0, 0.0, 1.0 );
                    
                }
        `;
}

function fragmentShader() {
    return `
                uniform sampler2D tTexture;
                varying vec2 vUv;
                            
                void main(){
                    gl_FragColor = texture2D( tTexture, vUv );
                }
        `;
}

export const ScreenSpaceQuadShader = {
    vertexShader,
    fragmentShader
};