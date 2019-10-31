import { StoryActionType } from "./StoryActionType.js";
import { objectKeyByValue } from "../../../core/model/ObjectUtils.js";
import { findCommanderOfEntity } from "../../../game/scenes/strategy/StrategyScene.js";
import ItemContainer from "../../../game/ecs/component/ItemContainer.js";
import Item from "../../../game/ecs/component/Item.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";
import { assert } from "../../../core/assert.js";
import TopDownCameraController from "../../input/ecs/components/TopDownCameraController.js";
import { CameraSystem } from "../../../graphics/ecs/camera/CameraSystem.js";
import { Transform } from "../../ecs/components/Transform.js";
import { clamp } from "../../../core/math/MathUtils.js";
import Army from "../../../game/ecs/component/Army.js";
import { CombatUnit } from "../../../game/ecs/component/CombatUnit.js";
import { UnitPlacement } from "../../../game/scenes/strategy/army-generator/UnitPlacementOptimizer.js";


const processors = {
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} id
     * @param {number} count
     */
    [StoryActionType.AddItem]: function (ecd, target, engine, { id, count }) {
        assert.typeOf(id, 'string', 'id');
        assert.typeOf(count, 'number', 'count');

        //find item container
        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {ItemContainer}
         */
        const itemContainer = ecd.getComponent(commander.entity, ItemContainer);

        const item = new Item();

        item.description = engine.staticKnowledge.items.get(id);
        item.count.set(count);

        itemContainer.addItem(item);
    },

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} id
     * @param {number} count
     */
    [StoryActionType.RemoveItem]: function (ecd, target, engine, { id, count }) {
        assert.typeOf(id, 'string', 'id');
        assert.typeOf(count, 'number', 'count');

        //find item container
        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {ItemContainer}
         */
        const itemContainer = ecd.getComponent(commander.entity, ItemContainer);

        itemContainer.removeItem(id, count);
    },


    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {number} amount
     */
    [StoryActionType.AddMoney]: function (ecd, target, engine, { amount }) {
        assert.typeOf(amount, 'number', 'amount');

        const commander = findCommanderOfEntity(target, ecd);

        commander.commander.money._add(amount);
    },

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {number} amount
     */
    [StoryActionType.RemoveMoney]: function (ecd, target, engine, { amount }) {
        assert.typeOf(amount, 'number', 'amount');

        const commander = findCommanderOfEntity(target, ecd);

        commander.commander.money._sub(amount);
    },

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} id
     */
    [StoryActionType.ShowStoryPage]: function (ecd, target, engine, { id }) {
        assert.typeOf(id, 'string', 'id');

        engine.story.pushPage(id);
    },

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} variable
     */
    [StoryActionType.IncrementVariable]: function (ecd, target, engine, { variable }) {
        assert.typeOf(variable, 'string', 'variable');

        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(commander.entity, Blackboard);

        const v = blackboard.acquireNumber(variable);

        v.increment();
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} variable
     */
    [StoryActionType.DecrementVariable]: function (ecd, target, engine, { variable }) {
        assert.typeOf(variable, 'string', 'variable');

        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(commander.entity, Blackboard);

        const v = blackboard.acquireNumber(variable);

        v.decrement();
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} variable
     */
    [StoryActionType.SetBooleanVariable]: function (ecd, target, engine, { variable, value }) {
        assert.typeOf(variable, 'string', 'variable');
        assert.typeOf(value, 'boolean', 'value');

        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(commander.entity, Blackboard);

        const v = blackboard.acquireBoolean(variable);

        v.set(value);
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} variable
     */
    [StoryActionType.SetNumberVariable]: function (ecd, target, engine, { variable, value }) {
        assert.typeOf(variable, 'string', 'variable');
        assert.typeOf(value, 'number', 'value');

        const commander = findCommanderOfEntity(target, ecd);

        /**
         *
         * @type {Blackboard}
         */
        const blackboard = ecd.getComponent(commander.entity, Blackboard);

        const v = blackboard.acquireNumber(variable);

        v.set(value);
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {number} entity
     * @param {number} distance
     */
    [StoryActionType.CameraFocusEntity]: function (ecd, target, engine, { entity, distance }) {

        let c = null;

        CameraSystem.traverseActiveCameras(ecd, (camera, entity) => {
            c = entity;
        });

        if (c === undefined) {
            console.error('No active camera found');
            return;
        }

        const tdcc = ecd.getComponent(c, TopDownCameraController);

        if (tdcc === undefined) {
            console.error(`Active camera(=${c}) does not have TopDownCameraController`);
            return;
        }

        if (!ecd.entityExists(entity)) {
            console.error(`target entity(=${entity}) does not exist`);
            return;
        }

        const t = ecd.getComponent(entity, Transform);

        if (t === undefined) {
            console.error(`Target entity(=${entity}) does not have Transform`);
        }

        tdcc.target.copy(t.position);
        tdcc.distance = clamp(distance, tdcc.distanceMin, tdcc.distanceMax);
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} id
     */
    [StoryActionType.ScenePush]: function (ecd, target, engine, { id }) {
        engine.sceneManager.stackPush(id);
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} target
     * @param {Engine} engine
     * @param {string} id
     */
    [StoryActionType.SceneDestroy]: function (ecd, target, engine, { id }) {
        const sm = engine.sceneManager;

        const scene = sm.getByName(id);

        if (scene === undefined) {
            throw new Error(`Scene '${id}' not found`);
        }

        scene.dataset.clear();

        //flag the scene as destroyed
        scene.destroyed = true;
    },
    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} storyTarget
     * @param {Engine} engine
     * @param {number} entity
     * @param {string} id Unit ID
     * @param {number} level Unit level
     * @param {number} target
     */
    [StoryActionType.UnitAdd]: function (ecd, storyTarget, engine, { id, level, target }) {
        assert.typeOf(id, "string", "id");
        assert.typeOf(level, "number", "level");
        assert.typeOf(target, "number", "target");

        if (!ecd.entityExists(target)) {
            throw new Error(`target(=${target}) entity does not exist`);
        }
        /**
         *
         * @type {Army}
         */
        const army = ecd.getComponent(target, Army);

        if (army === undefined) {
            throw new Error(`target(=${target}) entity does not have an Army component`);
        }

        const unitDescription = engine.staticKnowledge.units.get(id);

        if (unitDescription === null) {
            throw new Error(`Unit with id='${id}' not found in the database`);
        }

        if (!Number.isInteger(level)) {
            throw new Error(`unit level must be an integer, instead was '${level}'`);
        }

        if (level < 1) {
            throw new Error(`unit level must be >= 1, instead was ${level}`);
        }

        if (!Number.isFinite(level)) {
            throw new Error(`unit level is not finite(=${level})`);
        }

        const combatUnit = new CombatUnit();

        combatUnit.description.set(unitDescription);
        combatUnit.level.set(level);

        const placement = new UnitPlacement();

        placement.initialize(army.units.asArray());

        if (!placement.findEmptySlotFor(combatUnit, combatUnit.position)) {
            throw new Error(`No space found for unit '${id}' in target(=${target}) Army`);
        }

        army.units.add(combatUnit);
    }
};

export class StoryActionExecutor {
    constructor() {

        this.target = -1;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.dataset = null;

        /**
         *
         * @type {Engine}
         */
        this.engine = null;
    }

    /**
     *
     * @param {EntityComponentDataset} dataset
     */
    initialize(dataset) {
        this.dataset = dataset;
    }

    /**
     *
     * @param {number} entity
     */
    setTarget(entity) {
        this.target = entity;
    }


    /**
     *
     * @param {StoryAction} action
     * @throws {Error} if no processor found for the action of this type
     */
    execute(action) {
        assert.notEqual(this.dataset, null, 'dataset is null');
        assert.notEqual(this.target, -1, 'target is not set');
        assert.notEqual(this.engine, null, 'engine is null');

        const type = action.type;

        const processor = processors[type];

        if (processor === undefined) {
            throw new Error(`No processor found for action type '${objectKeyByValue(StoryActionType, type)}(=${type})'`);
        }

        processor(this.dataset, this.target, this.engine, action.parameters);
    }
}
