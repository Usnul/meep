/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:32 PM
 */
const Element = function () {
    /**
     * to form a linked list of elements
     * @type {Element}
     */
    this.next = null;
    /**
     * to form a linked list of elements
     * @type {Element}
     */
    this.prior = null;
    /**
     * to retrieve one symedge adjacent to this element
     * @type {SymEdge}
     */
    this.symedge = null;
};
export default Element;
