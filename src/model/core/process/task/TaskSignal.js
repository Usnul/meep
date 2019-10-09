/**
 * Created by Alex on 25/08/2016.
 */


/**
 * @readonly
 * @enum {number}
 */
const TaskSignal = {
    EndSuccess: 0,
    EndFailure: 1,
    Continue: 2,
    Yield: 3
};

export default TaskSignal;
