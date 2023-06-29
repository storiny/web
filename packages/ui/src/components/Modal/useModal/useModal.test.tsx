import { act } from "@testing-library/react";
import React from "react";

import {
  renderHookWithProvider,
  renderTestWithProvider,
} from "~/redux/testUtils";

import { ModalProps } from "../Modal.props";
import { useModal } from "./useModal";

describe("useModal", () => {
  it("returns the modal element, invocation callback, and open state", () => {
    const { result } = renderHookWithProvider(() => useModal(<span />));

    expect(React.isValidElement(result.current[0])).toBeTrue();
    expect(result.current[1]).toEqual(expect.any(Function));
    expect(result.current[2]).toBeBoolean();
  });

  it("renders modal, matches snapshot, and passes props to the root component", () => {
    const { result } = renderHookWithProvider(() => useModal(<span />));

    act(() => {
      result.current[1]("Test", {
        slotProps: {
          content: {
            "data-testid": "modal-content",
          },
        },
        open: true,
      } as ModalProps);
    });

    const { baseElement, getByTestId } = renderTestWithProvider(
      result.current[0]
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("modal-content")).toBeInTheDocument();
  });

  it("renders modal with children", () => {
    const { result } = renderHookWithProvider(() => useModal(<span />));

    act(() => {
      result.current[1](<p data-testid={"modal-child"}></p>, {
        open: true,
      });
    });

    const { getByTestId } = renderTestWithProvider(result.current[0]);

    expect(getByTestId("modal-child")).toBeInTheDocument();
  });
});
