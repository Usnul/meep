/**
 * Created by Alex on 11/09/2015.
 */

const ClearMaskPass = function () {

    this.enabled = true;

};

ClearMaskPass.prototype = {

    render: function (renderer, writeBuffer, readBuffer, delta) {

        const context = renderer.context;

        context.disable(context.STENCIL_TEST);

    }

};

export default ClearMaskPass;