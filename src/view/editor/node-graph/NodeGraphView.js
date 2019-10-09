import View from "../../View.js";
import { AutoCanvasView } from "../ecs/components/common/AutoCanvasView.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import Vector1 from "../../../model/core/geom/Vector1.js";
import ListView from "../../ui/common/ListView.js";
import { NodeView } from "./NodeView.js";
import List from "../../../model/core/collection/List.js";
import { DraggableAspect } from "../../../model/engine/ui/DraggableAspect.js";
import { ConnectionEndpoint } from "../../../model/core/model/node-graph/ConnectionEndpoint.js";
import { PortDirection } from "../../../model/core/model/node-graph/node/PortDirection.js";
import { clamp, lerp, max2, min2 } from "../../../model/core/math/MathUtils.js";

export class NodeGraphCamera {
    constructor() {
        this.position = new Vector2();
        /**
         *
         * @type {Vector1}
         */
        this.scale = new Vector1(1);
    }
}

const v2 = new Vector2();

const CONNECTION_WIDTH = 4;
const PORT_BEND_OFFSET_X = 100;

export class NodeGraphView extends View {
    /**
     *
     * @param {NodeGraph} graph
     * @param {NodeGraphVisualData} visual
     * @param {NodeGraphCamera} camera
     * @param {NodeDescriptionVisualRegistry} nodeVisualRegistry
     */
    constructor({ graph, visual, camera, nodeVisualRegistry }) {
        super();

        /**
         *
         * @type {NodeGraphCamera}
         */
        this.camera = camera;

        /**
         *
         * @type {NodeGraph}
         */
        this.graph = graph;

        /**
         *
         * @type {NodeGraphVisualData}
         */
        this.visual = visual;

        /**
         *
         * @type {List<number>}
         */
        this.selection = new List();

        this.el = document.createElement('div');

        this.addClass('ui-node-graph-view');

        const tempConnection = {
            enabled: false,
            anchor: new Vector2(),
            endpoint: null
        };

        const vBlockCanvas = new ListView(graph.nodes, {
            classList: ['block-canvas'],
            /**
             *
             * @param {NodeInstance} node
             * @returns {View}
             */
            elementFactory(node) {
                let nodeVisualData = visual.getNode(node.id);

                if (nodeVisualData === undefined) {
                    const vd0 = nodeVisualRegistry.get(node.description.id);

                    if (vd0 === undefined) {
                        throw new Error(`Node (name='${node.description.name}', id=${node.description.id}) not found in registry`);
                    }

                    const vd1 = vd0.clone();

                    vd1.id = node.id;

                    visual.addNode(node.id, vd1);

                    nodeVisualData = vd1;
                }

                const nodeView = new NodeView({
                    node,
                    visual: nodeVisualData,
                    visualData: visual,
                    portCreationCallback(portView, port) {

                        const draggableAspect = new DraggableAspect({
                            el: portView.el,
                            dragStart(p) {

                                const endpoint = new ConnectionEndpoint();

                                endpoint.instance = node;
                                endpoint.port = port;

                                tempConnection.enabled = true;
                                tempConnection.endpoint = endpoint;
                                tempConnection.anchor = p.clone();
                            },
                            dragEnd() {
                                tempConnection.enabled = false;

                                vConnectionCanvas.render();
                            },
                            drag(p, o) {
                                const scale = camera.scale.getValue();
                                tempConnection.anchor.set(
                                    (p.x / scale + camera.position.x),
                                    (p.y / scale + camera.position.y)
                                );

                                vConnectionCanvas.render();
                            }
                        });

                        draggableAspect.getPointer().on.up.add(() => {
                            //pointer released above the port

                            if (tempConnection.enabled) {
                                /**
                                 *
                                 * @type {ConnectionEndpoint}
                                 */
                                const endpoint = tempConnection.endpoint;

                                const endpointPort = endpoint.port;

                                if (endpointPort === port) {
                                    //can't connect port to itself
                                    return;
                                }

                                if (endpointPort.direction === port.direction) {
                                    //can't connect ports of teh same directionality
                                    return;
                                }

                                const dataType = endpointPort.dataType;

                                //check that the port types match
                                if (port.dataType === dataType) {

                                    if (endpointPort.direction === PortDirection.Out) {
                                        graph.createConnection(endpoint.instance.id, endpointPort.id, node.id, port.id);
                                    } else {
                                        graph.createConnection(node.id, port.id, endpoint.instance.id, endpointPort.id);
                                    }

                                }
                            }
                        });

                        portView.on.linked.add(draggableAspect.start, draggableAspect);
                        portView.on.unlinked.add(draggableAspect.stop, draggableAspect);

                    }
                });

                nodeView.bindSignal(nodeView.position.onChanged, vConnectionCanvas.render, vConnectionCanvas);

                return nodeView;
            }
        });

        this.addChild(vBlockCanvas);


        //create canvas to draw connections on
        const vConnectionCanvas = new AutoCanvasView({
            classList: ['connection-canvas']
        });

        const v2_source = new Vector2();
        const v2_target = new Vector2();

        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param width
         * @param height
         */
        vConnectionCanvas.draw = (ctx, width, height) => {
            ctx.clearRect(0, 0, width, height);

            ctx.lineWidth = max2(1, CONNECTION_WIDTH * camera.scale.getValue());
            ctx.lineCap = 'round';

            //draw connections
            graph.connections.forEach(connection => {


                const source = connection.source;
                const target = connection.target;

                this.getEndpointGraphPosition(source, v2_source);

                this.getEndpointGraphPosition(target, v2_target);


                this.drawConnection(ctx, v2_source, v2_target, source.port.dataType);

            });

            //draw temp connection

            if (tempConnection.enabled) {
                /**
                 *
                 * @type {ConnectionEndpoint}
                 */
                const endpoint = tempConnection.endpoint;

                this.getEndpointGraphPosition(endpoint, v2_source);
                const dataType = endpoint.port.dataType;
                if (endpoint.port.direction === PortDirection.Out) {
                    this.drawConnection(ctx, v2_source, tempConnection.anchor, dataType);
                } else {
                    this.drawConnection(ctx, tempConnection.anchor, v2_source, dataType);
                }
            }
        };

        this.addChild(vConnectionCanvas);

        this.size.onChanged.add((x, y) => {
            vConnectionCanvas.size.set(x, y);
        });

        function onCameraChange() {
            const scale = camera.scale.getValue();
            const p = camera.position;

            vBlockCanvas.scale.setScalar(scale);
            vBlockCanvas.position.set(-p.x * scale, -p.y * scale);

            vConnectionCanvas.render();
        }

        this.initializeNavigationControls();

        this.on.linked.add(onCameraChange);
        this.bindSignal(camera.position.onChanged, onCameraChange);
        this.bindSignal(camera.scale.onChanged, onCameraChange);
    }

    initializeNavigationControls() {
        const cameraPosition = new Vector2();
        const camera = this.camera;

        const canvasSize = this.size;

        const draggableAspect = new DraggableAspect({
            el: this.el,
            dragStart() {
                cameraPosition.copy(camera.position)
            },
            drag(p, o) {
                const d = o.clone();

                d.sub(p);
                d.multiplyScalar(1 / camera.scale.getValue());

                d.add(cameraPosition);

                camera.position.copy(d);
            }
        });

        draggableAspect.getPointer().on.wheel.add((delta, position) => {
            const scaleDelta = -delta.y / 20;
            const oldScale = camera.scale.getValue();


            const v = (1 + scaleDelta) * oldScale;
            const newScale = clamp(v, .03, 4);

            const actualScaleDelta = newScale / oldScale - 1;

            camera.scale.set(newScale);


            const canvasSizeInGraphSpace = new Vector2();
            canvasSizeInGraphSpace.copy(canvasSize);
            canvasSizeInGraphSpace.divideScalar(newScale);

            const selectionSizeDelta = new Vector2();
            selectionSizeDelta.copy(canvasSizeInGraphSpace);
            selectionSizeDelta.multiplyScalar(actualScaleDelta);

            const graphCameraPosition = new Vector2();
            this.transformPointGraph2Canvas(camera.position, graphCameraPosition);


            const localOffset = position.clone().sub(graphCameraPosition);

            const normalizedOffset = localOffset.clone();
            normalizedOffset.divide(canvasSize);

            const positionDelta = selectionSizeDelta.clone();
            positionDelta._multiply(normalizedOffset.x, normalizedOffset.y);

            camera.position.add(positionDelta);
        });

        this.on.linked.add(draggableAspect.start, draggableAspect);
        this.on.unlinked.add(draggableAspect.stop, draggableAspect);

    }


    /**
     *
     * @param x0
     * @param y0
     * @param x1
     * @param y1
     * @returns {boolean}
     */
    isGraphAABBVisible(x0, y0, x1, y1) {

        const scale = this.camera.scale.getValue();
        const cp = this.camera.position;

        //transform graph-space to canvas-space
        const _x0 = (x0 - cp.x) * scale;
        const _y0 = (y0 - cp.y) * scale;
        const _x1 = (x1 - cp.x) * scale;
        const _y1 = (y1 - cp.y) * scale;

        return _x0 < this.size.x && _x1 > 0 && _y0 < this.size.y && _y1 > 0;
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2} source
     * @param {Vector2} target
     * @param {DataType} dataType
     */
    drawConnection(ctx, source, target, dataType) {
        //check that the connection is visible
        const cw_2 = (CONNECTION_WIDTH / 2);

        const x0 = min2(source.x, target.x) - (cw_2 + PORT_BEND_OFFSET_X);
        const y0 = min2(source.y, target.y) - cw_2;
        const x1 = max2(source.x, target.x) + cw_2 + PORT_BEND_OFFSET_X;
        const y1 = max2(source.y, target.y) + cw_2;

        if (!this.isGraphAABBVisible(x0, y0, x1, y1)) {
            //connection is not visible, don't draw
            return;
        }

        const cameraScale = this.camera.scale.getValue();

        const alpha = clamp(lerp(0, 1, cameraScale * CONNECTION_WIDTH), 0, 1);

        const dataColor = this.visual.getDataColor(dataType.id);
        ctx.strokeStyle = `rgba(${dataColor.r * 255}, ${dataColor.g * 255}, ${dataColor.b * 255}, ${alpha})`;

        ctx.beginPath();

        this.transformPointGraph2Canvas(source, v2);

        ctx.moveTo(v2.x, v2.y);

        const cp1x = v2.x + PORT_BEND_OFFSET_X * cameraScale;
        const cp1y = v2.y;

        this.transformPointGraph2Canvas(target, v2);


        const cp2x = v2.x - PORT_BEND_OFFSET_X * cameraScale;
        const cp2y = v2.y;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, v2.x, v2.y);

        ctx.stroke();
    }

    /**
     *
     * @param {ConnectionEndpoint} endpoint
     * @param {Vector2} output
     */
    getEndpointGraphPosition(endpoint, output) {
        const instance = endpoint.instance;

        const nodeVisualData = this.visual.getNode(instance.id);

        const nodePosition = nodeVisualData.dimensions.position;

        const portVisualData = nodeVisualData.getPort(endpoint.port.id);

        const portPosition = portVisualData.position;

        const x = nodePosition.x + portPosition.x;
        const y = nodePosition.y + portPosition.y;

        output.set(x, y);
    }

    /**
     * Convert point from Graph coordinate space to Canvas coordinate space
     * @param {Vector2} input
     * @param {Vector2} output
     */
    transformPointGraph2Canvas(input, output) {
        const scale = this.camera.scale.getValue();
        const p = this.camera.position;

        const x = (input.x - p.x) * scale;
        const y = (input.y - p.y) * scale;

        output.set(x, y);
    }

    /**
     * Convert point from Canvas coordinate space to Graph coordinate space
     * @param {Vector2} input
     * @param {Vector2} output
     */
    transformPointCanvas2Graph(input, output) {
        const scale = this.camera.scale.getValue();
        const p = this.camera.position;

        const x = (input.x / scale) + p.x;
        const y = (input.y / scale) + p.y;

        output.set(x, y);
    }
}
