/**
 * Created by Alex on 15/03/2016.
 */


import TileView from './Tile';

import View from "../../../View";
import dom from "../../../DOM";

import Vector2 from "../../../../model/core/geom/Vector2";
import Signal from "../../../../model/core/events/signal/Signal.js";

import { DragAndDropContext } from '../../common/dnd/DragAndDropContext.js';

const slotElementPrototype = dom('div').addClass('marker').el;

class SlotView extends View {
    constructor(model, options) {
        super(model, options);
        this.el = slotElementPrototype.cloneNode(false);

        this.size.copy(options.cellSize);
    }
}


class TileGridView extends View {
    /**
     *
     * @param {TileGrid} tileGrid
     * @param options
     * @constructor
     */
    constructor(tileGrid, options) {
        super(tileGrid, options);

        let dragAndDropContext = options.dragAndDropContext;

        if (dragAndDropContext === undefined) {
            dragAndDropContext = new DragAndDropContext();
        }

        /**
         *
         * @type {TileGrid}
         */
        this.model = tileGrid;

        const enableDragAndDrop = options.enableDragAndDrop;

        const dRoot = dom("div").addClass("ui-tile-grid-view");
        this.el = dRoot.el;

        const dMarkers = dom('div').addClass('marker-container');
        const vMarkers = new View();
        vMarkers.el = dMarkers.el;

        const dTiles = dom('div').addClass('tile-container');
        const vTiles = new View();
        vTiles.el = dTiles.el;

        this.addChild(vMarkers);
        this.addChild(vTiles);

        this.on.tap = new Signal();

        const self = this;

        const slots = this.slots = [];


        function generateSlots(width, height) {
            function makeSlotView(x, y) {
                const v = new SlotView(null, options);
                const discretePosition = new Vector2(x, y);

                const pos = TileView.calculatePosition(options.cellSize, options.spacing, discretePosition);
                v.position.copy(pos);

                function validateDrop(draggable) {
                    if (draggable.parent.domain === self) {
                        //all well
                        return true;
                    }

                    if (draggable.view.lockDragContext === true) {
                        //item is not allowed to move to another context
                        return false;
                    }

                    let occupiedTile = null;
                    tileGrid.tiles.visitFirstMatch(function (t) {
                        return t.position.equals(discretePosition);
                    }, function (matchingTile) {
                        occupiedTile = matchingTile;
                    });

                    if (occupiedTile === null) {
                        //tile is unoccupied, validation depends on capacity constraint
                        return tileGrid.capacity.getValue() >= tileGrid.tiles.length + 1;
                    } else {
                        const tileView = findTileView(occupiedTile);
                        if (tileView.lockDragContext) {
                            //swap target is not allowed to move, prevent this swap
                            return false;
                        } else {
                            //it's a tile swap, capacity will not be affected after transaction
                            return true;
                        }
                    }
                }

                if (options.enableDragAndDrop) {

                    const target = dragAndDropContext.addTarget(v, self, validateDrop);
                    target.on.added.add(function (draggable, oldParent) {

                        const tile = draggable.view.model;
                        if (oldParent.domain === self) {
                            const move = tileGrid.computeMove(tile, discretePosition.x, discretePosition.y);
                            if (move !== null) {
                                move();

                                move.instructions.forEach(function (instruction) {
                                    const tile = instruction.tile;
                                    tileGrid.tiles.removeOneOf(tile);
                                    tileGrid.tiles.add(tile);
                                });

                            } else {
                                //move is not possible
                                console.error('move is not possible');
                            }
                        } else {
                            //see if the slot is occupied
                            tileGrid.tiles.visitFirstMatch(function (t) {
                                return t.position.equals(discretePosition);
                            }, function (matchingTile) {
                                matchingTile.position.copy(tile.position);
                                //current occupant that needs to move
                                const otherGrid = oldParent.domain.model;
                                tileGrid.tiles.removeOneOf(matchingTile);
                                otherGrid.tiles.add(matchingTile);
                            });
                            tile.position.copy(discretePosition);
                            tileGrid.add(tile);

                        }
                    });
                    target.on.removed.add(function (draggable, newDomain) {
                        if (newDomain !== self) {
                            const tile = draggable.view.model;
                            const i = tileGrid.tiles.indexOf(tile);
                            tileGrid.tiles.remove(i);
                        }
                    });
                    v.dropTarget = target;
                }
                return v;
            }

            let i = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {

                    const v = makeSlotView(x, y);
                    dMarkers.append(v.el);
                    slots[i++] = v;
                }
            }
        }

        function getSlot(x, y) {
            return slots[tileGrid.size.x * y + x];
        }

        function addTile(tile) {
            const tileView = new TileView(tile, options);

            if (options.hooks !== undefined && typeof options.hooks.added === "function") {
                options.hooks.added(tileView, tile);
            }

            self.addChild(tileView);

            const tileViewEl = tileView.el;
            //sign up drag and drop
            if (enableDragAndDrop) {
                const slot = getSlot(tile.position.x, tile.position.y);
                const dropTarget = slot.dropTarget;
                tileView.draggable = dragAndDropContext.addElement(tileView, dropTarget);
            }
            if (options.events !== undefined) {
                if (options.events.tap === true) {
                    tileViewEl.addEventListener('click', function (event) {
                        self.on.tap.dispatch(tile, tileView, event);
                    });
                }
            }
        }

        function findTileView(tile) {
            const children = self.children;
            for (let i = 0; i < children.length; i++) {
                const view = children[i];
                if (view.model === tile) {
                    return view;
                }
            }
        }

        function removeTile(tile) {
            const view = findTileView(tile);
            self.removeChild(view);
        }

        //place markers
        generateSlots(tileGrid.size.x, tileGrid.size.y);

        tileGrid.tiles.forEach(addTile);
        tileGrid.tiles.on.added.add(addTile);
        tileGrid.tiles.on.removed.add(removeTile);

        const areaForTiles = TileView.calculateSize(options.cellSize, options.spacing, tileGrid.size);

        this.size.copy(areaForTiles);
    }

    getChildByUUID(uuid) {
        const children = this.children;
        const numChildren = children.length;
        for (let i = 0; i < numChildren; i++) {
            const child = children[i];
            if (child.uuid === uuid) {
                return child;
            }
        }
        //not found
        return null;
    }
}


export default TileGridView;
