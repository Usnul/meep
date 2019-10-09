import BoundedValue from "./BoundedValue.js";

test("constructor",()=>{
    const b = new BoundedValue(7,11,3);

    expect(b.getValue()).toBe(7);
    expect(b.getUpperLimit()).toBe(11);
    expect(b.getLowerLimit()).toBe(3);
});

test("getFraction",()=>{
    expect(()=>new BoundedValue(0,0).getFraction()).not.toThrow();

    expect(new BoundedValue(0,1).getFraction()).toBeCloseTo(0);
    expect(new BoundedValue(2,4).getFraction()).toBeCloseTo(0.5);
    expect(new BoundedValue(7,7).getFraction()).toBeCloseTo(1);
});