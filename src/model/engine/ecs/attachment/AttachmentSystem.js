import { System } from "../System.js";
import { Attachment } from "./Attachment.js";
import Transform from "../components/Transform.js";
import { AttachmentSockets } from "../sockets/AttachmentSockets.js";
import { assert } from "../../../core/assert.js";
import Mesh from "../../../graphics/ecs/mesh/Mesh.js";
import { getSkeletonBoneByName } from "../../../graphics/ecs/mesh/SkeletonUtils.js";
import { Matrix4, Quaternion as ThreeQuaternion } from "three";
import Vector3 from "../../../core/geom/Vector3.js";

/**
 * @readonly
 * @enum {number}
 */
const WaitingType = {
    Entity: 0,
    Socket: 1,
    Mesh: 2,
    Transform: 3
};

class WaitingEntry {
    /**
     *
     * @param {number} entity
     * @param {WaitingType} type
     */
    constructor(entity, type) {
        /**
         *
         * @type {number}
         */
        this.entity = entity;
        /**
         *
         * @type {WaitingType}
         */
        this.type = type;
    }
}

class AttachmentBinding {
    constructor() {
        this.attachedEntity = -1;

        /**
         *
         * @type {Transform}
         */
        this.attachedTransform = null;


        this.parentEntity = -1;

        /**
         *
         * @type {Transform}
         */
        this.parentTransform = null;

        /**
         *
         * @type {AttachmentSocket}
         */
        this.socket = null;

        /**
         *
         * @type {Attachment}
         */
        this.attachment = null;
    }

    update() {

    }
}

class TransformAttachmentBinding extends AttachmentBinding {
    constructor() {
        super();

    }

    update() {
        const pT = this.parentTransform;

        const pM = new Matrix4();

        pM.compose(pT.position, pT.rotation, pT.scale);


        const attachment = this.attachment;
        const aT = attachment.transform;

        const t = this.attachedTransform;

        //build rotation
        t.rotation.multiplyQuaternions(pT.rotation, aT.rotation);

        //build scale
        t.scale.multiplyVectors(pT.scale, aT.scale);

        //build position
        const v3 = new Vector3();

        v3.copy(aT.position);
        v3.add(this.socket.offset);

        v3.applyMatrix4_three(pM);

        //write position
        t.position.copy(v3);
    }

    link() {
        this.parentTransform.position.onChanged.add(this.update, this);
        this.parentTransform.rotation.onChanged.add(this.update, this);
        this.parentTransform.scale.onChanged.add(this.update, this);
    }

    unlink() {
        this.parentTransform.position.onChanged.remove(this.update, this);
        this.parentTransform.rotation.onChanged.remove(this.update, this);
        this.parentTransform.scale.onChanged.remove(this.update, this);
    }
}

export class BoneAttachmentBinding extends AttachmentBinding {
    constructor() {
        super();

        /**
         *
         * @type {Bone}
         */
        this.bone = null;
    }

    update() {
        const socketTransform = this.socket.transform;

        const socketM4 = new Matrix4();

        socketM4.compose(socketTransform.position, new ThreeQuaternion().copy(socketTransform.rotation), socketTransform.scale);

        const pM = this.bone.matrixWorld;

        const pRotation = new ThreeQuaternion();
        const pScale = new Vector3();
        const pPosition = new Vector3();


        const attachment = this.attachment;
        const aT = attachment.transform;

        const attachmentM4 = new Matrix4();

        attachmentM4.compose(aT.position, new ThreeQuaternion().copy(aT.rotation), aT.scale);

        socketM4.multiplyMatrices(pM, socketM4);
        socketM4.multiply(attachmentM4);
        socketM4.decompose(pPosition, pRotation, pScale);

        const t = this.attachedTransform;

        t.rotation.copy(pRotation);

        t.scale.copy(pScale);

        t.position.copy(pPosition);
    }
}

export class AttachmentSystem extends System {
    constructor() {
        super();

        this.componentClass = Attachment;

        this.dependencies = [Transform];

        /**
         *
         * @type {number[]}
         */
        this.waiting = [];

        /**
         *
         * @type {Map<number,AttachmentBinding>}
         */
        this.bindings = new Map();
    }

    /**
     * Are we waiting for something?
     * @param {number} entity
     * @returns {boolean}
     */
    isWaiting(entity) {
        return this.waiting.some(e => e === entity);
    }

    /**
     * Attachment is missing something, wait for it
     * @param {number} entity
     */
    wait(entity) {

        if (this.isWaiting(entity)) {
            //already waiting, do nothing
            return;
        }

        this.waiting.push(entity);
    }

    /**
     * Removed all wait records for a given entity
     * @param {number} entity
     * @returns {number} number of removed records
     */
    clearAllWaitRecordsFor(entity) {
        let removedCount = 0;


        const waiting = this.waiting;

        let numRecords = waiting.length;

        for (let i = 0; i < numRecords; i++) {
            const entity = waiting[i];

            if (entity === entity) {
                waiting.splice(i, 1);
                removedCount++;

                //update iterator
                i--;
                numRecords--;
            }
        }

        return removedCount;
    }


    /**
     *
     * @param {Attachment} attachment
     * @param {Transform} transform
     * @param {number} entity
     */
    link(attachment, transform, entity) {
        this.wait(entity);
        this.processWaiting();
    }

    processWaiting() {
        const em = this.entityManager;

        if (em === null) {
            return;
        }

        /**
         *
         * @type {EntityComponentDataset}
         */
        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        const waiting = this.waiting;

        let numRecords = waiting.length;

        for (let i = 0; i < numRecords; i++) {
            const entity = waiting[i];


            const attachment = ecd.getComponent(entity, Attachment);

            /**
             *
             * @type {number}
             */
            const parent = attachment.parent;

            if (!ecd.entityExists(parent)) {
                continue;
            }


            /**
             *
             * @type {AttachmentSockets}
             */
            const sockets = ecd.getComponent(parent, AttachmentSockets);

            if (sockets === undefined) {
                //no sockets
                continue;
            }


            const parentTransform = ecd.getComponent(parent, Transform);
            if (parentTransform === undefined) {
                //no parent transform
                continue;
            }


            /**
             *
             * @type {AttachmentSocket}
             */
            const attachmentSocket = sockets.get(attachment.socket);
            if (attachmentSocket === undefined) {
                //socket doesn't exist
                continue;
            }


            let binding;

            if (attachmentSocket.isBoneAttachmentSocket) {

                const boneName = attachmentSocket.boneName;

                assert.typeOf(boneName, 'string', 'boneName');

                //try to get the bone
                const mesh = ecd.getComponent(parent, Mesh);

                if (mesh === undefined || !mesh.isLoaded) {
                    continue;
                }


                const skeletonBone = getSkeletonBoneByName(mesh, boneName);


                binding = new BoneAttachmentBinding();

                binding.bone = skeletonBone;

            } else {
                //it's a transform socket
                binding = new TransformAttachmentBinding();
            }

            binding.parentTransform = parentTransform;
            binding.parentEntity = parent;

            binding.attachedEntity = entity;
            binding.attachedTransform = ecd.getComponent(entity, Transform);

            binding.socket = attachmentSocket;
            binding.attachment = attachment;


            this.bindings.set(entity, binding);


            //update iterator
            this.waiting.splice(i, 1);

            i--;
            numRecords--;
        }

    }

    /**
     *
     * @param {Attachment} attachment
     * @param {Transform} transform
     * @param {number} entity
     */
    unlink(attachment, transform, entity) {

        //clear wait queue
        this.clearAllWaitRecordsFor(entity);

        //remove potential binding
        this.bindings.delete(entity);
    }

    update(timeDelta) {
        //process wait queue
        this.processWaiting();
        this.bindings.forEach(binging => binging.update());
    }
}
