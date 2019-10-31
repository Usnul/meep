import { StoryPage } from "./StoryPage.js";
import { GameAssetType } from "../../asset/GameAssetType.js";
import { StoryPageView } from "../../../../view/ui/story/dialogue/StoryPageView.js";
import EntityBuilder from "../../ecs/EntityBuilder.js";
import GUIElement from "../../ecs/gui/GUIElement.js";
import ViewportPosition from "../../ecs/gui/ViewportPosition.js";
import { SerializationMetadata } from "../../ecs/components/SerializationMetadata.js";
import { Tag } from "../../ecs/components/Tag.js";
import { StoryActionExecutor } from "../action/StoryActionExecutor.js";
import { findPlayerCharacter } from "../../../game/scenes/strategy/StrategyScene.js";
import { Stack } from "../../../core/collection/Stack.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { Input } from "../../input/ecs/components/Input.js";

export class StoryManager {
    constructor() {
        /**
         *
         * @type {StoryPage[]}
         */
        this.pages = [];


        /**
         *
         * @type {Stack<EntityBuilder>}
         */
        this.activeStack = new Stack();

        /**
         *
         * @type {EntityManager|null}
         */
        this.entityManager = null;

        /**
         *
         * @type {Localization|null}
         */
        this.localization = null;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = null;

        /**
         *
         * @type {Engine}
         */
        this.engine = null;


        /**
         *
         * @type {StoryActionExecutor}
         */
        this.executor = new StoryActionExecutor();

        /**
         * Whether or not a story page is currently being presented
         * @readonly
         * @type {ObservedBoolean}
         */
        this.presenting = new ObservedBoolean(false);
    }

    /**
     *
     * @param {Engine} engine
     */
    initialize({
                   engine
               }) {

        this.engine = engine;

        this.assetManager = engine.assetManager;
        this.entityManager = engine.entityManager;
        this.localization = engine.localization;

        //
        this.executor.engine = engine;


        //connect presenting variable
        this.activeStack.on.added.add(() => {
            if (!this.presenting.getValue()) {
                this.presenting.set(true);
            }
        });

        this.activeStack.on.removed.add(() => {
            if (this.activeStack.isEmpty()) {
                //last was removed
                this.presenting.set(false);
            }
        });
    }

    /**
     *
     * @param {StoryPageChoice} choice
     */
    executeStoryChoice(choice) {
        //close page
        this.popPage();

        choice.actions.forEach(action => {
            this.executeAction(action);
        });
    }

    /**
     *
     * @param {StoryAction} action
     */
    executeAction(action) {
        const ecd = this.entityManager.dataset;

        const executor = this.executor;

        //find player
        const character = findPlayerCharacter(ecd);

        executor.setTarget(character);

        executor.dataset = ecd;

        executor.execute(action);
    }

    /**
     *
     * @returns {Promise}
     */
    startup() {
        return this.loadDefinitions(this.assetManager);
    }

    /**
     *
     * @param {AssetManager} assetManager
     */
    loadDefinitions(assetManager) {
        return new Promise((resolve, reject) => {
            assetManager.get(
                "data/database/story/data.json",
                GameAssetType.JSON,
                (asset) => {
                    try {

                        const json = asset.create();

                        this.pages.splice(0, this.pages.length);

                        json.forEach(j => {
                            const page = new StoryPage();

                            page.fromJSON(j);

                            this.addPage(page);
                        });

                    } catch (e) {

                        reject(e);

                        return;
                    }

                    resolve();

                }, reject);
        });
    }

    /**
     *
     * @param {StoryPage} page
     * @returns {boolean}
     */
    addPage(page) {
        const existing = this.getPage(page.id);

        if (existing !== undefined) {
            console.error(`Page ${page.id} already exists, ignoring new page`);
            return false;
        }

        this.pages.push(page);

        return true;
    }

    /**
     *
     * @param {String} id
     * @returns {StoryPage}
     */
    getPage(id) {
        return this.pages.find(s => s.id === id);
    }

    /**
     *
     * @param {StoryPage} scene
     */
    present(scene) {
        const view = new StoryPageView(scene, this);

        const em = this.entityManager;

        const ecd = em.dataset;

        const builder = new EntityBuilder();

        const guiElement = GUIElement.fromView(view);

        const viewportPosition = new ViewportPosition();

        const input = new Input();
        input.bind('pointer/on/tap', 'try-implicit');
        input.bind('keyboard/keys/space/down', 'try-implicit');


        builder.add(guiElement)
            .add(viewportPosition)
            .add(SerializationMetadata.Transient)
            .add(Tag.fromJSON(['Story', 'Scene']))
            .add(input)
            .build(ecd);


        const tryTakeImplicitChoice = () => {
            if (scene.choices.length === 1 && scene.choices[0].implicit) {
                //take implicit choice
                this.executeStoryChoice(scene.choices[0]);
            }
        };

        builder.addEventListener('try-implicit', tryTakeImplicitChoice);

        return builder;
    }

    popPage() {
        /**
         * @type {EntityBuilder}
         */
        const builder = this.activeStack.pop();

        builder.destroy();

        //activate top of the stack
        if (!this.activeStack.isEmpty()) {
            const top = this.activeStack.peek();

            top.build(this.entityManager.dataset);
        }
    }

    /**
     *
     * @param {String} id
     */
    pushPage(id) {
        const scene = this.getPage(id);

        if (scene === undefined) {
            throw new Error(`Scene '${id}' was not found`);
        }

        const entityBuilder = this.present(scene);

        //check if stack has something on it
        if (!this.activeStack.isEmpty()) {
            const oldTop = this.activeStack.peek();

            oldTop.destroy();
        }

        this.activeStack.push(entityBuilder);
    }
}
