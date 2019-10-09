/**
 * Created by Alex on 15/03/2016.
 */
import View from "../../../View";
import dom from "../../../DOM";

import UUID from "../../../../model/core/UUID";

class TileView extends View {
    constructor(tile, options) {
        super(tile, options);
        this.model = tile;
        this.uuid = UUID.generate();

        this.settings = options;

        this.el = dom("div").addClass("ui-tile-grid-element-view").el;

        const self = this;

        function updatePosition() {
            self.position.copy(self.calculatePosition());
        }

        function updateSize() {
            self.size.copy(self.calculateSize());
        }

        updateSize();

        //listen to position changes
        tile.position.process(updatePosition);
    }

    calculatePosition() {
        const settings = this.settings;

        const spacing = settings.spacing;
        const cellSize = settings.cellSize;

        const discretePosition = this.model.position;
        return TileView.calculatePosition(cellSize, spacing, discretePosition);
    }

    calculateSize() {
        const settings = this.settings;

        const spacing = settings.spacing;
        const cellSize = settings.cellSize;

        const discreteSize = this.model.size;

        return TileView.calculateSize(cellSize, spacing, discreteSize);
    }

    render() {
        const size = this.model.size.clone().multiply(this.tileSize);
        this.size.copy(size);
    }

    static calculatePosition(cellSize, spacing, discretePosition) {
        return cellSize.clone().add(spacing).multiply(discretePosition);
    }

    static calculateSize(cellSize, spacing, discreteSize) {
        const result = cellSize.clone().multiply(discreteSize);

        const gaps = discreteSize.clone().addScalar(-1).clampLow(0, 0);
        result.add(gaps.multiply(spacing));
        return result;
    }
}


export default TileView;
