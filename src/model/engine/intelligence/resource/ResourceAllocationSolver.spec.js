import { ResourceAllocationSolver } from "./ResourceAllocationSolver.js";
import { Resource } from "./Resource.js";
import { ResourceAllocation } from "./ResourceAllocation.js";
import { ResourceAllocationBid } from "./ResourceAllocationBid.js";

test("constructor doesn't throw", () => {
    new ResourceAllocationSolver();
});

test("solve empty", () => {
    const solver = new ResourceAllocationSolver();

    const allocations = solver.solve();

    expect(allocations).toEqual([]);
});

test("solve for 1 resource exact assignment", () => {
    const solver = new ResourceAllocationSolver();

    solver.addResource(new Resource(1, "a"));

    const bidA = new ResourceAllocationBid(
        new ResourceAllocation([
            new Resource(1, "a")
        ]),
        1
    );

    solver.addBid(
        bidA
    );

    const allocations = solver.solve();

    expect(allocations).toEqual([bidA]);
});

test("solve for 1 resource, 2 different bids", () => {
    const solver = new ResourceAllocationSolver();

    solver.addResource(new Resource(1, "a"));

    const bidA = new ResourceAllocationBid(
        new ResourceAllocation([
            new Resource(1, "a")
        ]),
        1
    );

    const bidB = new ResourceAllocationBid(
        new ResourceAllocation([
            new Resource(1, "a")
        ]),
        1
    );

    bidA.weight = 1;
    bidB.weight = 2;

    solver.addBids([
        bidA,
        bidB
    ]);

    const allocations = solver.solve();

    expect(allocations.length).toEqual(1);
    expect(allocations[0]).toBe(bidB);
});

test("solve for 2 resource, 2 different bids", () => {
    const solver = new ResourceAllocationSolver();

    solver.addResource(new Resource(2, "a"));

    const bidA = new ResourceAllocationBid(
        new ResourceAllocation([
            new Resource(1, "a")
        ]),
        1
    );

    const bidB = new ResourceAllocationBid(
        new ResourceAllocation([
            new Resource(1, "a")
        ]),
        1
    );

    bidA.weight = 1;
    bidB.weight = 2;

    solver.addBids([
        bidA,
        bidB
    ]);

    const allocations = solver.solve();

    expect(allocations.length).toBe(2);
    expect(allocations.indexOf(bidA)).not.toBe(-1);
    expect(allocations.indexOf(bidB)).not.toBe(-1);
});