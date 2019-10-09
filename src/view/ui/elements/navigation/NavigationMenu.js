/**
 * Created by Alex on 07/11/2016.
 */

function MenuOption() {
    this.type = null;
    this.name = "";
    this.children = "";
}

function NavigationMenu(options) {
    let structure = options.structure;

}

NavigationMenu.OptionType = {
    Menu: "menu",
    Action: "action"
};

NavigationMenu.prototype.addOption = function (option) {
    if (typeof el === "function") {
        //this is a teminal option and it must produce
    }
};

export default NavigationMenu;