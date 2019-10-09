/**
 * Marker component to distinguish editor-owned entities
 * @constructor
 */
function EditorEntity({ referenceEntity = -1 } = {}) {
    this.referenceEntity = referenceEntity;
}

EditorEntity.typeName = "EditorEntity";
EditorEntity.serializable = false;

export default EditorEntity;
