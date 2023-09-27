import { render_hook_with_provider } from "src/redux/test-utils";

import { useDebounce } from "./useDebounce";

const mockSetTimeout = (): void => {
  jest.useFakeTimers();
  jest.spyOn(global, "setTimeout");
};

describe("useDebounce", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns debounced value", () => {
    const value = "test";
    const {
      result: { current: debouncedValue }
    } = render_hook_with_provider(() => useDebounce(value));

    expect(value).toEqual(debouncedValue);
  });

  it("uses a default debounce timeout of 500ms", () => {
    mockSetTimeout();
    render_hook_with_provider(() => useDebounce("test"));

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);
  });

  it("uses a custom debounce timeout", () => {
    mockSetTimeout();
    render_hook_with_provider(() => useDebounce("test", 1440));

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1440);
  });
});
