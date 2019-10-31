import View from "../../../View.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import EmptyView from "../../elements/EmptyView.js";
import ImageView from "../../elements/image/ImageView.js";
import ButtonView from "../../elements/button/ButtonView.js";
import { MouseEvents } from "../../../../model/engine/input/devices/events/MouseEvents.js";
import { TouchEvents } from "../../../../model/engine/input/devices/events/TouchEvents.js";

export class StoryPageView extends View {

    /**
     *
     * @param {StoryPage} page
     * @param {StoryManager} manager
     */
    constructor(page, manager) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-story-page-view');

        const localization = manager.localization;

        const vTextContainer = new EmptyView({ classList: ['text-container'] });

        this.addChild(vTextContainer);

        //create title
        vTextContainer.addChild(new LocalizedLabelView({
            id: page.title.key,
            localization,
            classList: page.title.classList.concat(['title'])
        }));


        const vLines = new EmptyView({ classList: ['lines'] });
        vTextContainer.addChild(vLines);

        //create lines
        page.lines.forEach(line => {

            vLines.addChild(new LocalizedLabelView({
                id: line.key,
                localization,
                classList: line.classList.concat(['line'])
            }))

        });

        //create images
        const vImageContainer = new EmptyView({ classList: ['image-container'] });

        this.addChild(vImageContainer);

        page.images.forEach(image => {

            const view = new ImageView(image.url, { classList: image.classList.concat(['image']) });

            vImageContainer.addChild(view);


            const style = view.el.style;

            style.width = `${image.size.x * 100}vh`;
            style.height = `${image.size.y * 100}vh`;

            style.transform = `translate(${image.position.x * 100}vw,${image.position.y * 100}vh)`;

            view.css(image.css);
        });

        //create choices

        const vChoices = new EmptyView({ classList: ['choices'] });

        vTextContainer.addChild(vChoices);

        const choices = page.choices;

        //check for implicit choice
        if (choices.length === 1 && choices[0].implicit) {
            //implicit choice
            const implicitChoiceMarker = new EmptyView({
                classList: ['implicit-choice-marker']
            });

            const takeAction = () => {
                manager.executeStoryChoice(choices[0]);
            };

            implicitChoiceMarker.el.addEventListener(MouseEvents.Click, takeAction);
            implicitChoiceMarker.el.addEventListener(TouchEvents.End, takeAction);

            vTextContainer.addChild(implicitChoiceMarker);
        } else {

            choices.forEach(choice => {
                const buttonView = new ButtonView({
                    classList: choice.classList.concat(['choice']),
                    action() {
                        manager.executeStoryChoice(choice)
                    }
                });

                const labelView = new LocalizedLabelView({
                    id: choice.label,
                    localization
                });

                buttonView.addChild(labelView);

                vChoices.addChild(buttonView);
            });

        }
    }
}
