function BinaryHeap(scoreFunction) {
    this.content = [];
    this.hash = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function (element) {
        const content = this.content;
        const length = content.length;
        // Add the new element to the end of the array.
        content.push(element);
        //update hash
        this.hash[element] = length;

        // Allow it to sink down.
        this.sinkDown(length);
    },
    pop: function () {
        // Store the first element so we can return it later.
        const content = this.content;
        const hash = this.hash;
        const result = content[0];
        //update hash
        delete hash[result];
        // Get the element at the end of the array.
        const end = content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        const length = content.length;
        if (length > 0) {
            content[0] = end;
            hash[end] = 0;
            this.bubbleUp(0);
        }
        return result;
    },
    contains: function (node) {
        return this.hash[node] !== void 0;
    },
    remove: function (node) {

        const length = this.content.length;
        const i = this.hash[node];

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        const end = this.content.pop();
        if (i !== length) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    },
    size: function () {
        return this.content.length;
    },
    rescoreElement: function (node) {
        this.sinkDown(this.hash[node]);
    },
    sinkDown: function (n) {
        // Fetch the element that has to be sunk.
        const content = this.content;
        const hash = this.hash;
        const element = content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            const parentN = ((n + 1) >> 1) - 1,
                parent = content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                content[parentN] = element;
                content[n] = parent;
                //update hash
                hash[element] = parentN;
                hash[parent] = n;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    },
    bubbleUp: function (n) {
        // Look up the target element and its score.
        const content = this.content;
        const hash = this.hash;
        const scoreFunction = this.scoreFunction;
        const length = content.length,
            element = content[n],
            elemScore = scoreFunction(element);

        while (true) {
            // Compute the indices of the child elements.
            const child2N = (n + 1) << 1,
                child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            let swap = null,
                child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                const child1 = content[child1N];
                child1Score = scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1N;
                }

            }

            // Do the same checks for the other child.
            if (child2N < length) {
                const child2 = content[child2N],
                    child2Score = scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                const swapContent = content[swap];
                content[n] = swapContent;
                content[swap] = element;
                //update hash
                hash[element] = swap;
                hash[swapContent] = n;
                n = swap;
            }
            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
};
export default BinaryHeap;
