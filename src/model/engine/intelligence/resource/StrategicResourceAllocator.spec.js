import { StrategicResourceAllocator } from "./StrategicResourceAllocator.js";
import { Resource } from "./Resource.js";
import { TacticalModule } from "./TacticalModule.js";
import { ResourceAllocationBid } from "./ResourceAllocationBid.js";
import { ResourceAllocation } from "./ResourceAllocation.js";

test("constructor doesn't throw", () => {
    new StrategicResourceAllocator();
});

test("allocate 0 resources with no modules", () => {
    const allocator = new StrategicResourceAllocator();

    expect(() => {
        allocator.allocate([]);
    }).not.toThrow();
});

test("allocate 1 resource with no modules", () => {
    const allocator = new StrategicResourceAllocator();

    expect(() => {
        allocator.allocate([new Resource(1, "a")]);
    }).not.toThrow();
});

test("allocate 1 resource with 1 module", () => {
    const allocator = new StrategicResourceAllocator();

    const module = new TacticalModule();

    module.collectBids = jest.fn(resources => {
        return Promise.resolve([
            new ResourceAllocationBid(new ResourceAllocation(resources), 1)
        ]);
    });

    allocator.addTacticalModule(module);

    const resources = [new Resource(1, "a")];
    allocator.allocate(resources);

    expect(module.collectBids).toHaveBeenCalledTimes(1);
    expect(module.collectBids).toHaveBeenCalledWith(resources);
});
