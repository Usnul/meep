/**
 * Created by Alex on 14/01/2017.
 */


import GuiControl from '../../../ui/controller/controls/GuiControl';
import Vector3Control from '../../../ui/controller/controls/Vector3Control';
import Vector3 from '../../../../model/core/geom/Vector3';

import LabelView from '../../../ui/common/LabelView';

import { Euler as ThreeEuler } from 'three';

class TransformController extends GuiControl {
    constructor() {
        super();

        this.cPosition = new Vector3Control();
        this.cScale = new Vector3Control();
        this.cRotation = new Vector3Control();

        this.rotationProxy = new Vector3(0, 0, 0);

        this.cRotation.model.set(this.rotationProxy);

        const lPosition = new LabelView('Position');
        const lScale = new LabelView('Scale');
        const lRotation = new LabelView('Rotation');

        this.addChild(lPosition);
        this.addChild(this.cPosition);

        this.addChild(lScale);
        this.addChild(this.cScale);

        this.addChild(lRotation);
        this.addChild(this.cRotation);

        const self = this;

        this.handlers = {
            updateRotationFromModel: function () {
                if (self.isLinked) {
                    requestAnimationFrame(self.handlers.updateRotationFromModel);
                } else {
                    return;
                }

                const transform = self.model.get();
                if (transform !== null) {
                    const euler = new ThreeEuler();
                    euler.setFromQuaternion(transform.rotation);

                    //suppress double updates
                    self.rotationProxy.onChanged.remove(self.handlers.updateRotationToModel);

                    if (!Number.isNaN(euler.x) && !Number.isNaN(euler.y) && !Number.isNaN(euler.z)) {
                        self.rotationProxy.copy(euler);
                    }

                    //reactivate updates
                    self.rotationProxy.onChanged.add(self.handlers.updateRotationToModel);
                }
            },
            updateRotationToModel: function () {
                const transform = self.model.get();
                if (transform !== null) {
                    transform.rotation.__setFromEuler(self.rotationProxy.x, self.rotationProxy.y, self.rotationProxy.z, 'XYZ');
                }
            },
            modelChanged: function (newModel, oldModel) {
                if (newModel !== null) {
                    self.cPosition.model.set(newModel.position);
                    self.cScale.model.set(newModel.scale);
                    self.handlers.updateRotationFromModel();
                }
                if (oldModel !== null) {
                    //do nothing really
                }
            }
        };


        this.bindSignal(this.model.onChanged, this.handlers.modelChanged);
        this.bindSignal(this.rotationProxy.onChanged, this.handlers.updateRotationToModel);
    }

    link() {
        super.link();

        if (this.model.getValue() !== null) {
            this.handlers.modelChanged(this.model.getValue(), null);
        }
    }

    unlink() {
        super.unlink();

    }
}


export default TransformController;