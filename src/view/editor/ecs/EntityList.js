/**
 * Created by Alex on 14/01/2017.
 */


import View from "../../View";
import dom from "../../DOM";
import LabelView from '../../ui/common/LabelView';
import VirtualListView from '../../ui/common/VirtualListView';
import ButtonView from '../../ui/elements/button/ButtonView.js';
import ObservedValue from '../../../model/core/model/ObservedValue';
import Signal from '../../../model/core/events/signal/Signal.js';
import List from '../../../model/core/collection/List';
import Tag from '../../../model/engine/ecs/components/Tag';

import SelectionAddAction from '../../../model/editor/actions/concrete/SelectionAddAction';
import SelectionRemoveAction from '../../../model/editor/actions/concrete/SelectionRemoveAction';

class EntityView extends View {
    /**
     *
     * @param entity
     * @param {EntityComponentDataset} entityDataset
     * @constructor
     */
    constructor(entity, entityDataset) {
        super(entity, entityDataset);

        const dRoot = dom('div');

        dRoot.addClass('entity-view');

        this.el = dRoot.el;
        const self = this;

        this.model = entity;

        const lId = new LabelView(entity, { classList: ['id'] });
        lId.position.setX(0);
        this.addChild(lId);

        this.isSelected = new ObservedValue(false);

        const dCheckBox = dom('div');
        dCheckBox.addClass('selection');

        this.isSelected.onChanged.add(function (v) {
            dCheckBox.setClass('selected', v);
        });

        if (this.on === undefined) {
            this.on = {};
        }

        const signals = this.on;

        signals.selected = new Signal();

        dCheckBox.on('click', function () {
            signals.selected.dispatch();
        });

        //add tag text
        const tag = entityDataset.getComponent(entity, Tag);
        if (tag !== undefined) {
            const lTag = new LabelView(tag.name, {
                classList: ['tag']
            });
            this.addChild(lTag);
        }
        this.el.appendChild(dCheckBox.el);
    }
}


class EntityListView extends View {
    constructor(editor) {
        super(editor);

        const dRoot = dom('div');
        dRoot.addClass('entity-list-view');

        this.el = dRoot.el;

        if (this.on === undefined) {
            this.on = {};
        }

        this.on.interaction = new Signal();

        const hiddenEntities = new List();

        const self = this;
        this.editor = editor;

        function makeElement(entity) {
            const entityManager = editor.engine.entityManager;
            const entityDataset = entityManager.dataset;

            const entityView = new EntityView(entity, entityDataset);
            if (editor.selection.contains(entity)) {
                entityView.isSelected.set(true);
            }
            entityView.on.selected.add(function () {
                const actions = self.editor.actions;
                actions.mark();
                const value = !entityView.isSelected.get();
                if (value) {
                    actions.do(new SelectionAddAction([entity]));
                } else {
                    actions.do(new SelectionRemoveAction([entity]));
                }
            });

            entityView.el.addEventListener('click', function () {
                self.on.interaction.dispatch(entity);
            });

            return entityView;
        }

        const entityList = new List();


        const list = new VirtualListView(entityList, {
            lineSize: 20,
            elementFactory: makeElement
        });

        list.size.set(150, 600);

        const actionAdd = {
            name: "Add",
            action: function () {
                engine.entityManager.createEntity();
            }
        };

        const vAddButton = new ButtonView(actionAdd);
        vAddButton.size.set(100, 20);

        this.addChildAt(list, 0, 0, 0, 0);
        this.addChildAt(vAddButton, 0, 1, 0, 0);


        function addOne(entity) {
            //exclude editor-owned entities
            if (editor.isEditorEntity(entity)) {
                hiddenEntities.add(entity);

            } else {
                entityList.add(entity);
            }
        }

        function removeOne(entity) {
            const hiddenIndex = hiddenEntities.indexOf(entity);
            if (hiddenIndex !== -1) {
                hiddenEntities.remove(hiddenIndex);
            } else {
                entityList.removeOneOf(entity);
            }
        }

        function selectOne(entity) {
            list.renderedViews.forEach(function (v) {
                if (v.model === entity) {
                    v.isSelected.set(true);
                }
            });
        }

        function deselectOne(entity) {
            list.renderedViews.forEach(function (v) {
                if (v.model === entity) {
                    v.isSelected.set(false);
                }
            });
        }

        this.handlers = {
            addOne: addOne,
            removeOne: removeOne,
            selectOne: selectOne,
            deselectOne: deselectOne,
            reset: function () {
                //reset all
                entityList.reset();
                hiddenEntities.reset();
            }
        };


        const handlers = this.handlers;

        //listen for selection
        this.bindSignal(editor.selection.on.added, handlers.selectOne);
        this.bindSignal(editor.selection.on.removed, handlers.deselectOne);
        this.size.onChanged.add(function (x, y) {
            list.size.set(x, y);
        });
    }

    layout() {

    }

    link() {
        super.link();

        const entityManager = this.editor.engine.entityManager;

        const handlers = this.handlers;

        //list all active
        const dataset = entityManager.dataset;
        dataset.traverseEntityIndices(function (id) {
            handlers.addOne(id);
        });

        //propagate current selection
        this.editor.selection.forEach(handlers.selectOne);


        dataset.onEntityCreated.add(handlers.addOne);
        dataset.onEntityRemoved.add(handlers.removeOne);
        entityManager.on.reset.add(handlers.reset);

    }

    unlink() {
        super.unlink();

        const entityManager = this.editor.engine.entityManager;
        const dataset = entityManager.dataset;

        const handlers = this.handlers;

        //clear out entity list
        this.handlers.reset();

        dataset.onEntityCreated.remove(handlers.addOne);
        dataset.onEntityRemoved.remove(handlers.removeOne);
        entityManager.on.reset.remove(handlers.reset);
    }
}


export default EntityListView;
