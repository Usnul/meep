import View from "../../../View.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import ImageView from "../../elements/image/ImageView.js";
import EmptyView from "../../elements/EmptyView.js";

export class AchievementNotificationView extends View {
    /**
     *
     * @param {Achievement} achievement
     * @param {Localization} localization
     */
    constructor({
                    achievement,
                    localization
                }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-achievement-notification-view');

        const lTitle = new LocalizedLabelView({
            id: achievement.getLocalizationKeyForTitle(),
            localization,
            classList: ["title"]
        });

        const vIcon = new EmptyView({ classList: ['icon'] });

        vIcon.addChild(new EmptyView({ classList: ['background'] }));
        vIcon.addChild(new ImageView(achievement.icon, { classList: ['image'] }));
        vIcon.addChild(new EmptyView({ classList: ['foreground'] }));

        const vMarker = new EmptyView({ classList: ["marker"] });

        const vUnlocked = new LocalizedLabelView({
            id: "system.achievement.unlocked.label.text",
            localization,
            classList: ["unlocked"]
        });

        this.addChild(lTitle);
        this.addChild(vIcon);
        this.addChild(vMarker);
        this.addChild(vUnlocked);
    }
}
