/**
 * Created by Alex on 16/04/2016.
 */


import ObservedValue from '../../core/model/ObservedValue';
import { assert } from "../../core/assert.js";

export class Notification {
    /**
     *
     * @param {string} title
     * @param {string} description
     * @param {string} image URL to image
     * @param {string[]} classList
     * @constructor
     */
    constructor({ title = "", description = "", image = "", classList = [] }) {
        assert.ok(Array.isArray(classList), 'classList must be an array, was something else instead');

        this.title = title;

        this.description = description;

        this.image = new ObservedValue(image);

        this.classList = classList;
    }
}


/**
 * @readonly
 * @type {boolean}
 */
Notification.prototype.isNotification = true;
