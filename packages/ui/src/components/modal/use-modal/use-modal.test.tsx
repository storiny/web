import { act } from "@testing-library/react";
import React from "react";

import {
  render_hook_with_provider,
  render_test_with_provider
} from "src/redux/test-utils";

import { ModalProps } from "../modal.props";
import { use_modal } from "./use-modal";

describe("use_modal", () => {
  it("returns the modal element, invocation callback, and open state", () => {
    const { result } = render_hook_with_provider(() =>
      use_modal(() => <span />, <span />)
    );

    expect(React.isValidElement(result.current[0])).toBeTrue();
    expect(result.current[1]).toEqual(expect.any(Function));
    expect(result.current[2]).toEqual(expect.any(Function));
    expect(result.current[3]).toBeBoolean();
  });

  it("renders modal, matches snapshot, and passes props to the root component", () => {
    const { result } = render_hook_with_provider(() =>
      use_modal(() => <span />, "Test", {
        slot_props: {
          content: {
            "data-testid": "modal-content"
          }
        },
        open: true
      } as ModalProps)
    );

    act(() => {
      result.current[1](); // Open modal
    });

    const { baseElement, getByTestId } = render_test_with_provider(
      result.current[0]
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("modal-content")).toBeInTheDocument();
  });

  it("renders modal with children", () => {
    const { result } = render_hook_with_provider(() =>
      use_modal(() => <span />, <p data-testid={"modal-child"}></p>, {
        open: true
      })
    );

    act(() => {
      result.current[1](); // Open modal
    });

    const { getByTestId } = render_test_with_provider(result.current[0]);

    expect(getByTestId("modal-child")).toBeInTheDocument();
  });
});
