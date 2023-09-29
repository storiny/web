import { render_hook_with_provider } from "src/redux/test-utils";

import { use_debounce } from "./use-debounce";

const mock_set_timeout = (): void => {
  jest.useFakeTimers();
  jest.spyOn(global, "setTimeout");
};

describe("use_debounce", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns debounced value", () => {
    const value = "test";
    const {
      result: { current: debounced_value }
    } = render_hook_with_provider(() => use_debounce(value));

    expect(value).toEqual(debounced_value);
  });

  it("uses a default debounce timeout of 500ms", () => {
    mock_set_timeout();
    render_hook_with_provider(() => use_debounce("test"));

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 500);
  });

  it("uses a custom debounce timeout", () => {
    mock_set_timeout();
    render_hook_with_provider(() => use_debounce("test", 1440));

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1440);
  });
});
