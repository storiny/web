import { act } from "@testing-library/react";
import React from "react";

import {
  render_hook_with_provider,
  render_test_with_provider
} from "~/redux/test-utils";

import { ConfirmationProps } from "../confirmation.props";
import { use_confirmation } from "./use-confirmation";

describe("use_confirmation", () => {
  it("returns the confirmation element, invocation callback, and open state", () => {
    const { result } = render_hook_with_provider(() =>
      use_confirmation(() => <span />, {
        title: "Test title",
        description: "Test description"
      })
    );

    expect(React.isValidElement(result.current[0])).toBeTrue();
    expect(result.current[1]).toEqual(expect.any(Function));
    expect(result.current[2]).toEqual(expect.any(Function));
    expect(result.current[3]).toBeBoolean();
  });

  it("renders confirmation modal, matches snapshot, and passes props to the root component", () => {
    const { result } = render_hook_with_provider(() =>
      use_confirmation(() => <span />, {
        title: "Test title",
        description: "Test description",
        slot_props: {
          content: {
            "data-testid": "confirmation-content"
          }
        },
        open: true
      } as ConfirmationProps)
    );

    act(() => {
      result.current[1](); // Open confirmation
    });

    const { baseElement, getByTestId } = render_test_with_provider(
      result.current[0]
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("confirmation-content")).toBeInTheDocument();
  });
});
