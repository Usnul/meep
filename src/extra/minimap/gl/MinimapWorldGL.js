import { OrthographicCamera, Scene } from "three";
import { WebGLRendererPool } from "../../../model/graphics/render/RendererPool.js";
import { SignalBinding } from "../../../model/core/events/signal/SignalBinding.js";
import Vector2 from "../../../model/core/geom/Vector2.js";

export class MinimapWorldGL {
    /**
     *
     * @param {Vector2} canvasSize
     * @param {Rectangle} worldBounds
     */
    constructor({ canvasSize, worldBounds }) {
        /**
         *
         * @type {boolean}
         */
        this.renderNeedsUpdate = false;

        /**
         *
         * @type {Vector2}
         */
        this.canvasSize = canvasSize;
        /**
         *
         * @type {Rectangle}
         */
        this.worldBounds = worldBounds;

        /**
         *
         * @type {MinimapWorldLayer[]}
         */
        this.layers = [];

        /**
         *
         * @type {number}
         */
        this.animationFrameCallbackId = -1;

        /**
         *
         * @type {Scene}
         */
        this.scene = new Scene();
        /**
         *
         * @type {OrthographicCamera}
         */
        this.camera = new OrthographicCamera();
        this.updateCameraFocus();

        /**
         *
         * @type {WebGLRenderer | null}
         */
        this.renderer = null;

        this.domElement = null;

        /**
         *
         * @type {SignalBinding[]}
         */
        this.signalBindings = [
            new SignalBinding(canvasSize.onChanged, (x, y) => {
                if (this.renderer !== null) {

                    this.renderer.setSize(x, y);
                    this.renderNeedsUpdate = true;

                    this.layers.forEach(l => l.setViewportSize(x, y));
                }
            }),
            new SignalBinding(worldBounds.size.onChanged, this.updateCameraFocus.bind(this)),
            new SignalBinding(worldBounds.position.onChanged, this.updateCameraFocus.bind(this))
        ];
    }

    /**
     *
     * @param {MinimapWorldLayer} l
     */
    addLayer(l) {
        this.layers.push(l);
        this.scene.add(l.object);
    }


    updateCameraFocus() {
        const camera = this.camera;

        const worldBounds = this.worldBounds;

        const w = worldBounds.size.x ;
        const h = worldBounds.size.y ;

        camera.left = -w / 2;
        camera.right = +w / 2;
        camera.top = -h / 2;
        camera.bottom = +h / 2;

        const v2worldCenter = new Vector2(
            worldBounds.position.x + w / 2 ,
            worldBounds.position.y + h / 2
        );

        camera.position.set(v2worldCenter.x, -1, v2worldCenter.y);
        camera.lookAt(v2worldCenter.x, 0, v2worldCenter.y);

        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
    }

    startup() {
        const renderer = this.renderer = WebGLRendererPool.global.get();
        renderer.setClearColor(0, 0);
        renderer.setSize(this.canvasSize.x, this.canvasSize.y);

        this.layers.forEach(o => {
            o.startup();
            o.setViewportSize(this.canvasSize.x, this.canvasSize.y);
        });

        this.signalBindings.forEach(b => b.link());
        this.updateCameraFocus();

        this.renderNeedsUpdate = true;

        this.domElement = renderer.domElement;

        this.isRunning = true;

        const self = this;

        function animationUpdateCycle() {
            self.animationFrameCallbackId = requestAnimationFrame(animationUpdateCycle);
            self.update();
        }

        if (this.animationFrameCallbackId === -1) {
            this.animationFrameCallbackId = requestAnimationFrame(animationUpdateCycle);
        }
    }

    shutdown() {
        this.signalBindings.forEach(b => b.unlink());

        this.layers.forEach(o => o.shutdown());

        WebGLRendererPool.global.release(this.renderer);

        if (this.animationFrameCallbackId !== -1) {
            cancelAnimationFrame(this.animationFrameCallbackId);
            this.animationFrameCallbackId = -1;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        this.renderNeedsUpdate = false;
    }

    update() {
        this.layers.forEach(o => {
            o.update(this.camera);
            if (o.needsRender) {
                this.renderNeedsUpdate = true;
                o.needsRender = false;
            }
        });

        if (this.renderNeedsUpdate) {
            this.render();
        }
    }
}
