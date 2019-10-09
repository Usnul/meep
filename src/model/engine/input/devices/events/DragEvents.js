/**
 * Event names for DOM drag events
 * @enum {string}
 */
export const DragEvents = {
    /**
     * Fired when the user starts dragging an element or text selection
     */
    DragStart: 'dragstart',
    /**
     * Fired when a drag operation is being ended (for example, by releasing a mouse button or hitting the escape key)
     */
    DragEnd: 'dragend',
    /**
     * Fired when a dragged element or text selection enters a valid drop target.
     */
    DragEnter: 'dragenter',
    /**
     * Fired when an element is no longer the drag operation's immediate selection target.
     */
    DragExit:'dragexit',
    /**
     * Fired when a dragged element or text selection leaves a valid drop target.
     */
    DragLeave:'dragleave',
    /**
     * Fired when an element or text selection is being dragged over a valid drop target
     */
    DragOver: 'dragover',
    /**
     * Fired when an element or text selection is being dragged.
     */
    Drag: 'drag',
    /**
     * 	Fired when an element or text selection is dropped on a valid drop target.
     */
    Drop: 'drop',
};