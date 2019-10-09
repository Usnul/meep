import GuiControl from "./GuiControl.js";
import ButtonView from "../../elements/button/ButtonView.js";
import EmptyView from "../../elements/EmptyView.js";

class ListController extends GuiControl {
    /**
     *
     * @param itemFactory
     * @param {function(*):GuiControl} controllerFactory
     * @constructor
     */
    constructor(itemFactory, controllerFactory) {
        super();

        const self = this;

        const elementControllers = new Map();

        const bAdd = new ButtonView({
            action: function () {
                const item = itemFactory();

                const list = self.model.getValue();
                if (list !== null) {
                    list.add(item);
                }
            },
            name: 'Add',
            icon: undefined
        });

        bAdd.size.set(40, 20);

        const vContainer = new EmptyView({classList: ['container']});

this.addChild(vContainer);
        this.addChild(bAdd);

        function handleItemAdded(item) {
            const guiControl = controllerFactory(item);

            guiControl.model.set(item);

            guiControl.size.setX(self.size.x);

            elementControllers.set(item, guiControl);

            vContainer.addChild(guiControl);
        }

        function handleItemRemoved(item) {

            const guiControl = elementControllers.get(item);

            vContainer.removeChild(guiControl);

            guiControl.model.set(null);

            elementControllers.delete(item);
        }

        /**
         *
         * @param {List} list
         */
        function attachList(list) {
            list.forEach(handleItemAdded);

            list.on.added.add(handleItemAdded);
            list.on.removed.add(handleItemRemoved);
        }

        /**
         *
         * @param {List} list
         */
        function detachList(list) {
            list.forEach(handleItemRemoved);

            list.on.added.remove(handleItemAdded);
            list.on.removed.remove(handleItemRemoved);
        }

        function handleModelSet(list, oldList) {
            if (oldList !== null) {
                detachList(oldList);
            }

            if (list !== null) {
                attachList(list);
            }
        }

        this.model.onChanged.add(handleModelSet);
    }
}




export default ListController;
