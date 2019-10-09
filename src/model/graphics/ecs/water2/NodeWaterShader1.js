import { FloatNode } from "three/examples/jsm/nodes/inputs/FloatNode.js";
import { OperatorNode } from "three/examples/jsm/nodes/math/OperatorNode.js";
import { PositionNode } from "three/examples/jsm/nodes/accessors/PositionNode.js";
import { MathNode } from "three/examples/jsm/nodes/math/MathNode.js";
import { SwitchNode } from "three/examples/jsm/nodes/utils/SwitchNode.js";
import { StandardNodeMaterial } from "three/examples/jsm/nodes/materials/StandardNodeMaterial.js";
import { TextureNode } from "three/examples/jsm/nodes/inputs/TextureNode.js";
import { ScreenUVNode } from "three/examples/jsm/nodes/accessors/ScreenUVNode.js";
import { FunctionNode } from "three/examples/jsm/nodes/core/FunctionNode.js";
import { FunctionCallNode } from "three/examples/jsm/nodes/core/FunctionCallNode.js";
import { ColorNode } from "three/examples/jsm/nodes/inputs/ColorNode.js";
import { UVNode } from "three/examples/jsm/nodes/accessors/UVNode.js";
import { Vector2Node } from "three/examples/jsm/nodes/inputs/Vector2Node.js";
import { Vector4Node } from "three/examples/jsm/nodes/inputs/Vector4Node.js";
import CheckersTexture from "../../texture/CheckersTexture.js";
import { CondNode } from "three/examples/jsm/nodes/math/CondNode.js";
import { TimerNode } from "three/examples/jsm/nodes/utils/TimerNode.js";

export class NodeWaterShader {
    constructor(depthTexture, normalTexture) {

        const depthBuffer = new TextureNode(depthTexture, new ScreenUVNode());

        const uv = new UVNode();

        const heightUv = new Vector4Node();
        this.heightUv = heightUv;

        const heightUvSize = new SwitchNode(heightUv, 'zw');
        const worldUV = new OperatorNode(
            new OperatorNode(
                uv,
                new SwitchNode(heightUv, 'xy'),
                OperatorNode.ADD
            ),
            heightUvSize,
            OperatorNode.MUL
        );

        const heightTextureNode = new TextureNode(CheckersTexture.create(),
            worldUV,
        );

        this.heightTexture = heightTextureNode;

        this.heightRange = new FloatNode(1);
        this.level = new FloatNode(0);

        const textureRepeat = new Vector2Node(40, 40);

        const mainColor = new ColorNode();
        const shoreColor = new ColorNode('#387992');

        const cameraNear = new FloatNode(3);
        cameraNear.name = "cameraNear";

        const cameraFar = new FloatNode(24);
        cameraFar.name = "cameraFar";

        const positionNode = new PositionNode();

        const gaussianSample = new FunctionNode(`vec4 sampleTextureGaussian( sampler2D tex,vec2 uv, vec2 texelSize){
	        float r = 1.0;
	        
	        float dx0 = - texelSize.x * r;
			float dy0 = - texelSize.y * r;
			float dx1 = + texelSize.x * r;
			float dy1 = + texelSize.y * r;
			
			return (
				texture2D(tex, uv + vec2( dx0, dy0 ) ) +
				texture2D(tex, uv + vec2( 0.0, dy0 ) ) +
				texture2D(tex, uv + vec2( dx1, dy0 ) ) +
				texture2D(tex, uv + vec2( dx0, 0.0 ) ) +
				texture2D(tex, uv) +
				texture2D(tex, uv + vec2( dx1, 0.0 ) ) +
				texture2D(tex, uv + vec2( dx0, dy1 ) ) +
				texture2D(tex, uv + vec2( 0.0, dy1 ) ) +
				texture2D(tex, uv + vec2( dx1, dy1 ) )
			) * ( 1.0 / 9.0 );
        }`);

        const depthToLinear = new FunctionNode(`float depthToLinear( float z, float cameraNear, float cameraFar ) {
                float z_n = 2.0 * z - 1.0;
                
                float z_e = 2.0 * cameraNear * cameraFar / (cameraFar + cameraNear - z_n * (cameraFar - cameraNear));
	        
	            return z_e;
	        }`);

        const fragmentDepth = new FunctionNode('float fragmentDepth(){ return gl_FragCoord.z; }');

        const linearObjectDepth = new FunctionCallNode(depthToLinear, [
            new FunctionCallNode(fragmentDepth),
            cameraNear,
            cameraFar
        ]);

        const screenDepth = new SwitchNode(depthBuffer, 'x');

        const linearScreenDepth = new FunctionCallNode(depthToLinear, [
            screenDepth,
            cameraNear,
            cameraFar
        ]);


        var distance = new OperatorNode(
            linearScreenDepth,
            linearObjectDepth,
            OperatorNode.SUB
        );

        const mtl = new StandardNodeMaterial();


        const alpha = new FloatNode(1);

        const minFadeDepth = new FloatNode(0);
        const maxFadeDepth = new FloatNode(1.7);

        const deepWaterDepthMin = new FloatNode(0);
        const deepWaterDepthMax = new FloatNode(0.3);

        const heightmapResolution = new Vector2Node(512, 512);

        const distanceRange = new OperatorNode(maxFadeDepth, minFadeDepth, OperatorNode.SUB);

        const smoothHeight = new FunctionCallNode(gaussianSample, [heightTextureNode, worldUV,
            new OperatorNode(
                heightUvSize,
                heightmapResolution,
                OperatorNode.DIV
            )
        ]);

        const terrainHeight = new OperatorNode(
            new SwitchNode(
                smoothHeight
                , 'x'),
            this.heightRange,
            OperatorNode.MUL
        );

        mtl.color = new MathNode(
            mainColor,
            shoreColor,
            new MathNode(
                deepWaterDepthMin,
                deepWaterDepthMax,
                new MathNode(
                    terrainHeight,
                    new OperatorNode(
                        terrainHeight,
                        new MathNode(
                            new OperatorNode(
                                new OperatorNode(
                                    new OperatorNode(
                                        new SwitchNode(worldUV, 'x'),
                                        new SwitchNode(worldUV, 'y'),
                                        OperatorNode.ADD
                                    ),
                                    new FloatNode(20),
                                    OperatorNode.MUL
                                ),
                                new TimerNode(1),
                                OperatorNode.ADD
                            ),
                            MathNode.SIN
                        ),
                        OperatorNode.MUL
                    ),
                    new FloatNode(0.3),
                    MathNode.MIX
                ),
                MathNode.SMOOTHSTEP
            ),
            MathNode.MIX
        );

        const alphaGradient = new OperatorNode(
            new MathNode(
                new MathNode(distance, MathNode.ABS),
                minFadeDepth,
                maxFadeDepth,
                MathNode.CLAMP
            ),
            distanceRange,
            OperatorNode.DIV
        );
        mtl.alpha = new OperatorNode(
            alpha,
            alphaGradient,
            OperatorNode.MUL
        );

        // mtl.alpha = alpha;

        mtl.position = positionNode;
        mtl.mask = new CondNode(
            distance,
            new FloatNode(0),
            CondNode.GREATER
        );
        // mtl.normal = normalTextureNode;
        mtl.roughness = new FloatNode(0.7);
        mtl.metalness = new FloatNode(0);


        this.cameraNear = cameraNear;
        this.cameraFar = cameraFar;
        this.color = mainColor;
        this.alpha = alpha;
        this.textureRepeat = textureRepeat;

        this.material = mtl;
    }
}
