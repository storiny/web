import { axe, userEvent } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Confirmation from "./Confirmation";
import { ConfirmationColor, ConfirmationProps } from "./Confirmation.props";

describe("<Confirmation />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Confirmation description={"test"} open title={"test"} />
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Confirmation description={"test"} open title={"test"} />
    );

    await waitFor(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        as={"aside"}
        description={"test"}
        open
        slotProps={
          {
            content: { "data-testid": "content" },
          } as ConfirmationProps["slotProps"]
        }
        title={"test"}
      />
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders color `inverted` with `Cancel` and `Confirm` labels by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        description={"test"}
        open
        slotProps={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" },
          } as ConfirmationProps["slotProps"]
        }
        title={"test"}
      />
    );

    expect(getByTestId("confirm-button")).toHaveClass("color-inverted");
    expect(getByTestId("confirm-button")).toHaveTextContent(/^Confirm$/);
    expect(getByTestId("cancel-button")).toHaveTextContent(/^Cancel$/);
  });

  (["inverted", "ruby"] as ConfirmationColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Confirmation
          color={color}
          description={"test"}
          open
          slotProps={
            {
              confirmButton: { "data-testid": "confirm-button" },
            } as ConfirmationProps["slotProps"]
          }
          title={"test"}
        />
      );

      expect(getByTestId("confirm-button")).toHaveClass(`color-${color}`);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        decorator={<span data-testid={"decorator"} />}
        description={"test"}
        open
        title={"test"}
      />
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders labels", () => {
    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        cancelLabel={"test-cancel"}
        confirmLabel={"test-confirm"}
        description={"test"}
        open
        slotProps={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" },
          } as ConfirmationProps["slotProps"]
        }
        title={"test"}
      />
    );

    expect(getByTestId("confirm-button")).toHaveTextContent(/^test-confirm$/);
    expect(getByTestId("cancel-button")).toHaveTextContent(/^test-cancel$/);
  });

  it("handles action callbacks", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        description={"test"}
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        slotProps={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" },
          } as ConfirmationProps["slotProps"]
        }
        title={"test"}
      />
    );

    await user.click(getByTestId("confirm-button"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(getByTestId("cancel-button"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Confirmation
        decorator={<span />}
        description={"test"}
        open
        slotProps={
          {
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" },
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" },
            decorator: { "data-testid": "decorator" },
            container: { "data-testid": "container" },
            description: { "data-testid": "description" },
            divider: { "data-testid": "divider" },
            footer: { "data-testid": "footer" },
            title: { "data-testid": "title" },
            overlay: { "data-testid": "overlay" },
          } as ConfirmationProps["slotProps"]
        }
        title={"test"}
        trigger={<button>Trigger</button>}
      />
    );

    [
      "content",
      "trigger",
      "confirm-button",
      "cancel-button",
      "decorator",
      "container",
      "description",
      "divider",
      "footer",
      "title",
      "overlay",
    ].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
