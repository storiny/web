import { act } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { useScrollTrigger } from "./useScrollTrigger";

describe("useScrollTrigger", () => {
  it("returns `false` by default", () => {
    const Component = (): React.ReactElement => {
      const trigger = useScrollTrigger();
      return <span data-testid="trigger">{`${trigger}`}</span>;
    };

    const { getByTestId } = render_test_with_provider(<Component />);
    expect(getByTestId("trigger")).toHaveTextContent("false");
  });

  describe("scrolling", () => {
    const triggerRef = React.createRef<HTMLSpanElement>();
    const getTriggerValue = (): string | null | undefined =>
      triggerRef.current?.textContent;

    const Component = (): React.ReactElement => {
      const trigger = useScrollTrigger();
      return <span ref={triggerRef}>{`${trigger}`}</span>;
    };

    const dispatchScroll = (offset: number): void => {
      act(() => {
        Object.defineProperty(window, "pageYOffset", {
          value: offset
        });
        window.dispatchEvent(new window.Event("scroll", {}));
      });
    };

    it("triggers correctly", () => {
      render_test_with_provider(<Component />);
      [
        { offset: 100, result: "false" },
        { offset: 101, result: "true" },
        { offset: 100, result: "false" },
        { offset: 99, result: "false" },
        { offset: 100, result: "false" },
        { offset: 101, result: "true" },
        { offset: 102, result: "true" },
        { offset: 101, result: "false" },
        { offset: 99, result: "false" },
        { offset: 100, result: "false" },
        { offset: 101, result: "true" },
        { offset: 100, result: "false" },
        { offset: 102, result: "true" },
        { offset: -3, result: "false" },
        { offset: 3, result: "false" },
        { offset: 103, result: "true" },
        { offset: 102, result: "false" }
      ].forEach((test) => {
        dispatchScroll(test.offset);
        expect(getTriggerValue()).toEqual(test.result);
      });
    });

    it("does not trigger at exact threshold value", () => {
      render_test_with_provider(<Component />);
      [
        { offset: 100, result: "false" },
        { offset: 99, result: "false" },
        { offset: 100, result: "false" },
        { offset: 101, result: "true" },
        { offset: 100, result: "false" },
        { offset: 99, result: "false" },
        { offset: 100, result: "false" }
      ].forEach((test) => {
        dispatchScroll(test.offset);
        expect(getTriggerValue()).toEqual(test.result);
      });
    });

    it("correctly evaluates scroll events on page first load", () => {
      [
        { offset: 101, result: "true" },
        { offset: 100, result: "false" }
      ].forEach((test) => {
        Object.defineProperty(window, "pageYOffset", {
          value: test.offset
        });

        render_test_with_provider(<Component />);
        expect(getTriggerValue()).toEqual(test.result);
      });
    });
  });
});
