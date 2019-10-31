import { ViewEntity } from "./ViewEntity.js";
import { LocalizedLabelView } from "../../../../../view/ui/common/LocalizedLabelView.js";
import { StoryAction } from "../../../story/action/StoryAction.js";
import { MouseEvents } from "../../../input/devices/events/MouseEvents.js";
import { TouchEvents } from "../../../input/devices/events/TouchEvents.js";

export class ButtonViewEntity extends ViewEntity {
    constructor() {
        super();

        this.el = document.createElement('button');

        this.addClass('ui-button-view-entity');
        this.addClass('ui-button-view');

        this.actions = [];

        /**
         *
         * @type {StoryActionExecutor}
         */
        this.actionExecutor = null;

        const listener = () => {
            const actions = this.actions;

            this.actionExecutor.initialize(this.dataset);
            this.actionExecutor.setTarget(this.entity);

            actions.forEach(e => this.actionExecutor.execute(e));
        };

        this.el.addEventListener(MouseEvents.Click, listener);
        this.el.addEventListener(TouchEvents.End, listener);
    }

    initialize(parameters, entity, dataset, engine) {
        this.actionExecutor = engine.story.executor;
        this.dataset = dataset;
        this.entity = entity;

        const { label } = parameters;

        const classList = [];

        const pCL = parameters.classList;
        if (pCL !== undefined) {
            if (typeof pCL === "string") {

                pCL.split(',').map(s => s.trim()).forEach(s => classList.push(s));

            } else {
                console.warn(`classList parameter must be a string, instead was ${typeof pCL}`);
            }
        }

        const actions = this.actions;

        const actionsPrefix = 'actions.';
        for (let paramName in parameters) {
            if (paramName.startsWith(actionsPrefix)) {
                const actionName = paramName.slice(actionsPrefix.length);

                const parameterValue = parameters[paramName];

                let storyAction;

                try {
                    storyAction = StoryAction.fromJSON(JSON.parse(parameterValue));
                } catch (e) {
                    console.error('Failed to parse story action:', e, parameterValue);
                    continue;
                }

                storyAction.name = actionName;

                actions.push(storyAction);
            }
        }

        classList.forEach(c => this.addClass(c));

        this.addChild(new LocalizedLabelView({
            id: label,
            localization: engine.localization
        }));
    }

    finalize() {
        this.removeAllChildren();
        this.actions.splice(0, this.actions.length);
    }
}
