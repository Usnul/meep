import { Notification } from "../../notify/Notification.js";
import { randomFromArray } from "../../../core/math/MathUtils.js";
import { NotificationAreaKind } from "../GUIEngine.js";

function notificationGenerator(callback, timeout = 5) {
    const phrases = [
        "Hello World",
        "Fluffy Kitty",
        "Looking good",
        "Strange Rainbow",
        "Shrubbery",
        "What for",
        "Strawberry Sunday",
        "Mellow Melon",
        "This sure is a long piece of text"
    ];

    const descriptions = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla suscipit tristique elit ut sollicitudin. Pellentesque ornare orci dolor, vitae cursus leo consectetur at",
        "In venenatis turpis eu diam blandit rhoncus. Donec viverra dapibus cursus",
        "Maecenas eget magna id lacus efficitur bibendum ultrices sit amet metus."
    ];

    const icons = [];

    for (let i = 10; i < 109; i++) {
        icons.push(`data/textures/icons/SpellBookPage09/SpellBookPage09_${i}.png`);
    }

    setInterval(function () {
        const notification = new Notification({
            title: randomFromArray(phrases, Math.random),
            description: randomFromArray(descriptions, Math.random),
            image: randomFromArray(icons, Math.random)
        });
        callback(notification);
    }, timeout * 1000);
}

/**
 *
 * @param {NotificationManager} notifications
 */
function testNotifications(notifications) {
    notificationGenerator(n => {
        notifications.addNotification(n, NotificationAreaKind.Primary);
    }, 1.3);

    notificationGenerator(n => {
        notifications.addNotification(n, NotificationAreaKind.Secondary);
    }, 3);

    notificationGenerator(n => {
        notifications.addNotification(n, NotificationAreaKind.Toast);
    }, 1);
}
