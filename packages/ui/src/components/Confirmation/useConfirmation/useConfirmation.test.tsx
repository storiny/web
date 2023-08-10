import { act } from "@testing-library/react";
import React from "react";

import {
  renderHookWithProvider,
  renderTestWithProvider
} from "~/redux/testUtils";

import { ConfirmationProps } from "../Confirmation.props";
import { useConfirmation } from "./useConfirmation";

describe("useConfirmation", () => {
  it("returns the confirmation element, invocation callback, and open state", () => {
    const { result } = renderHookWithProvider(() =>
      useConfirmation(() => <span />, {
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
    const { result } = renderHookWithProvider(() =>
      useConfirmation(() => <span />, {
        title: "Test title",
        description: "Test description",
        slotProps: {
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

    const { baseElement, getByTestId } = renderTestWithProvider(
      result.current[0]
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("confirmation-content")).toBeInTheDocument();
  });
});
