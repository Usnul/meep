/**
 * Created by Alex on 16/04/2016.
 */


import { Notification } from './Notification';
import List from '../../core/collection/List';
import { assert } from "../../core/assert.js";

function NotificationLog() {
    /**
     *
     * @type {List<Notification>}
     */
    this.elements = new List();

    /**
     *
     * @type {number}
     */
    this.maxLength = 1000;
}

/**
 *
 * @param {{}} options See Notification.constructor for details
 * @returns {Notification}
 */
NotificationLog.prototype.add = function (options) {
    const notification = new Notification(options);

    this.addNotification(notification);

    return notification;
};

/**
 *
 * @param {Notification} notification
 */
NotificationLog.prototype.addNotification = function (notification) {
    assert.notEqual(notification, undefined, 'notification is undefined');
    assert.notEqual(notification, null, 'notification is null');

    assert.ok(notification.isNotification, 'not a Notification');

    // Crop notification log to size
    const length = this.elements.length;

    const target = this.maxLength - 1;

    if (length > target) {
        this.elements.crop(length - target, length);
    }

    this.elements.add(notification);
};

export default NotificationLog;
