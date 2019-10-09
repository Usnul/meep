/**
 * Original:
 * @see https://github.com/toji/webgl2-particles-2
 */

/**
 *
 * @param {WebGLRenderingContext} gl
 * @returns {*}
 */
function buildSimulationShader(gl) {

    const attributes = {
        position: 0,
        velocity: 1,
        origin: 2,
        randomSeed: 3,
    };

    function createProgram() {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, [
            '#version 300 es',
            'precision ' + renderer.getPrecision() + ' float;',

            'in vec4 position;',
            'in vec4 velocity;',
            'in vec4 origin;',
            'in highp uint randomSeed;',

            'out vec4 outPosition;',
            'out vec4 outVelocity;',
            'flat out highp uint outRandomSeed;',

            'uniform float time;',
            'uniform float timeDelta;',

            'highp uint curRandomSeed;',

            'float rand(){',
            // Use Microsoft's Visual C++ constants for the linear congruential generator
            '  curRandomSeed = (uint(214013) * curRandomSeed + uint(2531011));',
            '  return float((curRandomSeed >> 16) & uint(0x7FFF)) / 32767.0;',
            '}',

            'void runSimulation(vec4 pos, vec4 vel, out vec4 outPos, out vec4 outVel) {',
            '  outPos.x = pos.x + vel.x;',
            '  outPos.y = pos.y + vel.y;',
            '  outPos.z = pos.z + vel.z;',
            '  outPos.w = pos.w;',
            '  outVel = vel;',
            '  if (pos.w == 1.0) {',
            '    outVel = vel * 0.95;', // Cheap drag
            '    vec3 resetVec = normalize(origin.xyz - outPos.xyz) * 0.0005;',
            '    outVel.xyz += resetVec;',
            '  }',
            '}',

            'void main() {',
            '  vec4 pos = position;',
            '  curRandomSeed = randomSeed;',

            // Randomly end the life of the particle and reset it to it's original position
            // Moved particles reset less frequently.
            '  float resetRate = (pos.w == 1.0) ? 0.998 : 0.97;',
            '  if ( rand() > resetRate ) {',
            '    outPosition = vec4(origin.xyz, 0.0);',
            // This velocity reset should be in sync with the initialization values in index.html
            '    outVelocity = vec4((rand()-0.5) * 0.004,',
            '                       (rand()-0.5) * 0.004,',
            '                       (rand()-0.5) * 0.004,',
            '                       0.0);',
            '  } else {',
            '    runSimulation(position, velocity, outPosition, outVelocity);',
            '  }',

            '  outRandomSeed = curRandomSeed;',
            '}'
        ].join('\n'));

        gl.shaderSource(fragmentShader, ['' +
        '#version 300 es',
            'precision ' + renderer.getPrecision() + ' float;',

            'out vec4 fragColor;',

            'void main() {',
            'fragColor = vec4(1.0, 1.0, 1.0, 1.0);',
            '}'
        ].join('\n'));

        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Shader failed to compile", gl.getShaderInfoLog(vertexShader));
            return null;
        }

        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Shader failed to compile", gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        for (let i in attributes) {
            gl.bindAttribLocation(program, attributes[i], i);
        }

        gl.transformFeedbackVaryings(program, ["outPosition", "outVelocity", "outRandomSeed"], gl.SEPARATE_ATTRIBS);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Shader program failed to link", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    const program = createProgram();

    if (!program) {
        return null;
    }

    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
        uniform = gl.getActiveUniform(program, i);
        const name = uniform.name.replace("[0]", "");
        uniforms[name] = gl.getUniformLocation(program, name);
    }

    let timeValue = 0;
    let timeDelta = 0;

    return {
        program: program,

        attributes: attributes,

        bind: function () {
            gl.useProgram(program);
            gl.uniform1f(uniforms.time, timeValue);
            gl.uniform1f(uniforms.timeDelta, timeDelta);
        },

        setTime: function (time) {
            if (timeValue !== 0) {
                timeDelta = timeValue - time;
            }
            timeValue = time;
        },

        getTime: function (time) {
            return timeValue;
        }

    }
}

/**
 *
 * @param {WebGLRenderer} renderer
 */
function stepViaTransformFeedback(renderer) {


    /**
     *
     * @param {WebGLRenderingContext} gl
     * @param shader
     * @param {BufferGeometry} source
     * @param {BufferGeometry} target
     */
    function transformFeedbackPass(gl, shader, source, target) {
        if (!source || !target)
            return;

        const sourcePosAttrib = source.attributes['position'];
        const sourceVelAttrib = source.attributes['velocity'];
        const sourceRandomSeedAttrib = source.attributes['randomSeed'];
        const targetPosAttrib = target.attributes['position'];
        const targetVelAttrib = target.attributes['velocity'];
        const targetRandomSeedAttrib = target.attributes['randomSeed'];

        const sourcePosBuffer = renderer.properties.get(sourcePosAttrib).__webglBuffer;
        const sourceVelBuffer = renderer.properties.get(sourceVelAttrib).__webglBuffer;
        const sourceRandomSeedBuffer = renderer.properties.get(sourceRandomSeedAttrib).__webglBuffer;
        const targetPosBuffer = renderer.properties.get(targetPosAttrib).__webglBuffer;
        const targetVelBuffer = renderer.properties.get(targetVelAttrib).__webglBuffer;
        const targetRandomSeedBuffer = renderer.properties.get(targetRandomSeedAttrib).__webglBuffer;

        if (targetPosBuffer && sourcePosBuffer) {
            shader.bind();

            gl.enableVertexAttribArray(shader.attributes.position);
            gl.bindBuffer(gl.ARRAY_BUFFER, sourcePosBuffer);
            gl.vertexAttribPointer(shader.attributes.position, 4, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(shader.attributes.velocity);
            gl.bindBuffer(gl.ARRAY_BUFFER, sourceVelBuffer);
            gl.vertexAttribPointer(shader.attributes.velocity, 4, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(shader.attributes.origin);
            gl.bindBuffer(gl.ARRAY_BUFFER, originBuffer);
            gl.vertexAttribPointer(shader.attributes.origin, 4, gl.FLOAT, false, 16, 0);
            gl.enableVertexAttribArray(shader.attributes.randomSeed);
            gl.bindBuffer(gl.ARRAY_BUFFER, sourceRandomSeedBuffer);
            gl.vertexAttribIPointer(shader.attributes.randomSeed, 1, gl.UNSIGNED_INT, 0, 0);
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, targetPosBuffer);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, targetVelBuffer);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, targetRandomSeedBuffer);
            gl.enable(gl.RASTERIZER_DISCARD);
            gl.beginTransformFeedback(gl.POINTS);
            gl.drawArrays(gl.POINTS, 0, sourcePosAttrib.count /* sourcePosAttrib.itemSize*/);
            gl.endTransformFeedback();
            gl.disable(gl.RASTERIZER_DISCARD);
            // Unbind the transform feedback buffer so subsequent attempts
            // to bind it to ARRAY_BUFFER work.
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
            // Avoid messing with THREE.js's WebGL state
            // TODO(kbr): Further Diagnosis
            //gl.disableVertexAttribArray( shader.attributes.position );
            //gl.disableVertexAttribArray( shader.attributes.velocity );
            //gl.disableVertexAttribArray( shader.attributes.origin );
            gl.disableVertexAttribArray(shader.attributes.randomSeed);
            //gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }
}
