import { StoryAction } from "../action/StoryAction.js";
import { StoryPageChoice } from "./StoryPageChoice.js";
import { StoryPageImageSpec } from "./StoryPageImageSpec.js";
import { StyledTextLine } from "./StyledTextLine.js";
import { assert } from "../../../core/assert.js";

export class StoryPage {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {StoryAction[]}
         */
        this.actions = [];

        /**
         *
         * @type {StoryPageChoice[]}
         */
        this.choices = [];

        /**
         *
         * @type {StoryPageImageSpec[]}
         */
        this.images = [];

        /**
         *
         * @type {StyledTextLine}
         */
        this.title = StyledTextLine.Empty;

        /**
         *
         * @type {StyledTextLine[]}
         */
        this.lines = [];
    }

    fromJSON(
        {
            id,
            actions = [],
            choices,
            images = [],
            title = null,
            lines = []
        }
    ) {
        assert.typeOf(id, 'string', 'id');

        this.id = id;

        this.actions = actions.map(StoryAction.fromJSON);

        const choiceObjects = choices.map(StoryPageChoice.fromJSON);

        //count implicit choices
        const implicitChoices = choiceObjects.filter(c => c.implicit);

        if (implicitChoices.length > 1) {
            //too many implicit choices, at most 1 is allowed
            throw new Error(`Too many implicit choices, at most one is allowed instead got ${implicitChoices.length}`);
        }

        if (implicitChoices.length > 0 && choiceObjects.length > 1) {
            throw new Error(`If an implicit choice exists, no other choices are allowed, ${choiceObjects.length - implicitChoices.length} additional non-implicit choices were found`);
        }

        this.choices = choiceObjects;

        this.images = images.map(StoryPageImageSpec.fromJSON);

        if (title === null) {
            this.title = StyledTextLine.Empty;
        } else {
            this.title = StyledTextLine.fromJSON(title);
        }

        this.lines = lines.map(StyledTextLine.fromJSON);
    }
}
