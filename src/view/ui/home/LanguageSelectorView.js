import View from "../../View.js";
import EmptyView from "../elements/EmptyView.js";
import ImageView from "../elements/image/ImageView.js";
import ObservedString from "../../../model/core/model/ObservedString.js";
import List from "../../../model/core/collection/List.js";
import ListView from "../common/ListView.js";
import { MouseEvents } from "../../../model/engine/input/devices/events/MouseEvents.js";

/**
 * @extends {View}
 */
class LanguageOptionView extends View {
    constructor({ code, name, icon }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-language-option-view');


        this.addChild(new ImageView(icon, { classList: ['icon'] }));

        this.code = code;


    }
}

/**
 * @extends {View}
 */
export class LanguageSelectorView extends View {
    /**
     *
     * @param {object<string,*>} languages
     * @param {Localization} localization
     */
    constructor({ languages, localization }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-language-selector-view');

        const self = this;

        function openMenu() {
            self.addChild(vMenu);

            self.el.addEventListener(MouseEvents.Leave, closeMenu);
            self.el.removeEventListener(MouseEvents.Click, openMenu);
        }

        function closeMenu() {
            self.removeChild(vMenu);

            self.el.removeEventListener(MouseEvents.Leave, closeMenu);
            self.el.addEventListener(MouseEvents.Click, openMenu);
        }

        this.el.addEventListener(MouseEvents.Click, openMenu);

        const list = new List();
        const vMenu = new ListView(list, {
            classList: ["menu"],
            elementFactory({ code, icon }) {
                const vOption = new LanguageOptionView({ code, icon });

                vOption.el.addEventListener(MouseEvents.Click, function () {
                    closeMenu();

                    localization.loadLocale(code);
                });

                return vOption;
            }
        });


        const vCurrent = new EmptyView({ classList: ['current'] });
        const currentIcon = new ObservedString("");
        vCurrent.addChild(new ImageView(currentIcon, { classList: ['icon'] }));

        this.addChild(vCurrent);

        function updateCurrent() {
            const currentLocale = localization.locale.getValue();

            const language = languages[currentLocale];

            if (language !== undefined) {
                currentIcon.set(language.icon);
            }

            list.reset();
            for (const key in languages) {
                const lang = languages[key];

                if (lang === language) {
                    continue;
                }

                list.add({
                    code: key,
                    icon: lang.icon
                });
            }
        }

        this.on.linked.add(updateCurrent);
        this.bindSignal(localization.locale.onChanged, updateCurrent);


    }
}
