/**
 * Created by Alex on 30/06/2014.
 */


function Attacker(options) {
    this.target = null;
    this.range = options.range || 0;
    this.delay = options.delay || 1;
    this.timerValue = 0;
}

export default Attacker;
