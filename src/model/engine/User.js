/**
 * Created by Alex on 11/08/2015.
 */
const User = function () {
    /**
     *
     * @type {boolean}
     * @private
     */
    this.__isLoggedIn = false;
};

User.prototype.getAchievement = function () {

};

User.prototype.submitScore = function (value, options) {

};

User.prototype.login = function () {

};
User.prototype.isLoggedIn = function () {
    return this.__isLoggedIn;
};

export default User;