import View from "../../View.js";
import domify from "../../DOM.js";
import { DraggableAspect } from "../../../model/engine/ui/DraggableAspect.js";

class BottomLeftResizeHandleView extends View {
    constructor(controlView) {
        super();

        const $el = domify();

        $el.addClass('ui-bottom-left-resize-handle-view');

        this.el = $el.el;

        this.size.set(20, 20);

        const self = this;

        function layout() {
            self.position.set(0, controlView.size.y - self.size.y);
        }

        const draggableAspect = new DraggableAspect({
            el: $el.el,
            drag(position, anchor) {

                const delta = anchor.clone().sub(position);
                anchor.copy(position);

                controlView.position._add(-delta.x, 0);
                controlView.size._add(delta.x, -delta.y);
            }
        });


        this.on.linked.add(function () {
            draggableAspect.start();
            layout();
        });

        this.on.unlinked.add(function () {
            draggableAspect.stop();
        });

        this.bindSignal(controlView.size.onChanged, layout);
    }
}



export default BottomLeftResizeHandleView;

