import {
  decrementAction,
  falseAction,
  incrementAction,
  trueAction
} from "./actions";

describe("trueAction", () => {
  it("returns `true` when called", () => {
    expect(trueAction()).toBeTruthy();
  });
});

describe("falseAction", () => {
  it("returns `false` when called", () => {
    expect(falseAction()).toBeFalsy();
  });
});

describe("incrementAction", () => {
  it("returns incremented value when called", () => {
    expect(incrementAction(1)).toEqual(2);
  });
});

describe("decrementAction", () => {
  it("returns decremented value when called", () => {
    expect(decrementAction(2)).toEqual(1);
  });
});
