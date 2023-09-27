import { axe, userEvent } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Confirmation from "./Confirmation";
import { ConfirmationColor, ConfirmationProps } from "./Confirmation.props";

describe("<Confirmation />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Confirmation description={"test"} open title={"test"} />
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Confirmation description={"test"} open title={"test"} />
    );

    await waitFor(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Confirmation
        as={"aside"}
        description={"test"}
        open
        slot_props={
          {
            content: { "data-testid": "content" }
          } as ConfirmationProps["slot_props"]
        }
        title={"test"}
      />
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders color `inverted` with `Cancel` and `Confirm` labels by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Confirmation
        description={"test"}
        open
        slot_props={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" }
          } as ConfirmationProps["slot_props"]
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
      const { getByTestId } = render_test_with_provider(
        <Confirmation
          color={color}
          description={"test"}
          open
          slot_props={
            {
              confirmButton: { "data-testid": "confirm-button" }
            } as ConfirmationProps["slot_props"]
          }
          title={"test"}
        />
      );

      expect(getByTestId("confirm-button")).toHaveClass(`color-${color}`);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <Confirmation
        cancelLabel={"test-cancel"}
        confirmLabel={"test-confirm"}
        description={"test"}
        open
        slot_props={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" }
          } as ConfirmationProps["slot_props"]
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

    const { getByTestId } = render_test_with_provider(
      <Confirmation
        description={"test"}
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        slot_props={
          {
            confirmButton: { "data-testid": "confirm-button" },
            cancelButton: { "data-testid": "cancel-button" }
          } as ConfirmationProps["slot_props"]
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
    const { getByTestId } = render_test_with_provider(
      <Confirmation
        decorator={<span />}
        description={"test"}
        open
        slot_props={
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
            overlay: { "data-testid": "overlay" }
          } as ConfirmationProps["slot_props"]
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
      "overlay"
    ].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
