/**
 * Created by Alex on 15/01/2017.
 */
import View from '../../View';
import dom from '../../DOM';
import List from '../../../model/core/collection/List';
import { frameThrottle } from '../../../model/graphics/FrameThrottle';

class VirtualListView extends View {
    /**
     * @template T
     * @param {List.<T>} list
     * @param {number} [lineSize=20]
     * @param {number} [lineSpacing=0]
     * @param {function(element:T, index:number):View} elementFactory
     * @constructor
     */
    constructor(list, { lineSize = 20, lineSpacing = 0, elementFactory }) {

        super(list, lineSize, lineSpacing, elementFactory);

        this.data = list;

        if (elementFactory === undefined) {
            throw new Error("Element factory was not supplied");
        }

        const dRoot = dom('div');
        dRoot.addClass('list');
        dRoot.css({
            overflowY: "visible",
            overflowX: "visible"
        });

        this.el = dRoot.el;


        const vScrollArea = new View();
        const dScrollArea = dom('div');
        dScrollArea.addClass('scroll-area');
        dScrollArea.css({
            userSelect: "none"
        });
        vScrollArea.el = dScrollArea.el;

        this.addChild(vScrollArea);

        this.renderedViews = new List();

        const self = this;

        let firstVisibleLine = -1;
        let lastVisibleLine = -1;

        let isScrollBarVisible = false;

        function setScrollBar(flag) {
            if (isScrollBarVisible && !flag) {
                dRoot.css({
                    overflowY: "visible"
                });
            } else if (!isScrollBarVisible && flag) {
                dRoot.css({
                    overflowY: "scroll"
                });
            } else {
                //no change
                return;
            }

            isScrollBarVisible = flag;
        }

        function update() {
            const numTotalElements = self.data.length;
            const maxLength = lineSize * numTotalElements + lineSpacing * Math.max(0, numTotalElements - 1);

            const rowHeight = lineSize + lineSpacing;

            vScrollArea.size.setY(maxLength);
            //figure out currently visible lines
            const scrollY = self.el.scrollTop;

            const y0 = scrollY;
            const y1 = Math.min(scrollY + self.size.y, maxLength);

            const l0 = Math.floor(y0 / rowHeight);
            const l1 = Math.min(Math.ceil(y1 / rowHeight), numTotalElements - 1);

            //update cache
            firstVisibleLine = l0;
            lastVisibleLine = l1;

            //clear existing lines
            self.renderedViews.forEach(function (c) {
                vScrollArea.removeChild(c);
            });
            self.renderedViews.reset();

            let rowWidth = self.size.x;
            if (firstVisibleLine === 0 && lastVisibleLine == numTotalElements - 1 && rowHeight * (lastVisibleLine - firstVisibleLine) < self.size.y) {
                //entire set of data is visible, disable scroll bar
                setScrollBar(false);
            } else {
                rowWidth -= 17;
                setScrollBar(true);
            }

            let elementWidth = self.size.x;

            //generate views for visible lines
            for (let i = firstVisibleLine; i <= lastVisibleLine; i++) {
                const elementData = self.data.get(i);
                const lineView = elementFactory(elementData, i);

                if (lineView === undefined) {
                    console.error('Line view produced by element factory was undefined');
                    continue;
                }

                lineView.el.style.position = "absolute";
                //mark odd rows
                if (i % 2 === 1) {
                    lineView.el.classList.add('odd-row');
                }

                lineView.position.setY(i * rowHeight);
                lineView.size.set(rowWidth, lineSize);

                vScrollArea.addChild(lineView);
                self.renderedViews.add(lineView);
            }
        }

        const throttledUpdate = frameThrottle(update);

        this.handlers = {
            addOne: function (el) {
                throttledUpdate();
            },
            removeOne: function (el) {
                throttledUpdate();
            },
            update: throttledUpdate
        };

        this.el.addEventListener('scroll', throttledUpdate);
        vScrollArea.el.addEventListener('scroll', throttledUpdate);
    }

    link() {
        super.link();

        this.data.on.added.add(this.handlers.addOne);
        this.data.on.removed.add(this.handlers.removeOne);

        this.size.onChanged.add(this.handlers.update);

        this.data.forEach(this.handlers.addOne);
    }

    unlink() {
        super.unlink();

        this.data.on.added.remove(this.handlers.addOne);
        this.data.on.removed.remove(this.handlers.removeOne);

        this.size.onChanged.remove(this.handlers.update);
    }
}


export default VirtualListView;
