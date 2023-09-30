import { axe, user_event } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Confirmation from "./confirmation";
import { ConfirmationColor, ConfirmationProps } from "./confirmation.props";

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

    await wait_for(async () =>
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
            confirm_button: { "data-testid": "confirm-button" },
            cancel_button: { "data-testid": "cancel-button" }
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
              confirm_button: { "data-testid": "confirm-button" }
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
        cancel_label={"test-cancel"}
        confirm_label={"test-confirm"}
        description={"test"}
        open
        slot_props={
          {
            confirm_button: { "data-testid": "confirm-button" },
            cancel_button: { "data-testid": "cancel-button" }
          } as ConfirmationProps["slot_props"]
        }
        title={"test"}
      />
    );

    expect(getByTestId("confirm-button")).toHaveTextContent(/^test-confirm$/);
    expect(getByTestId("cancel-button")).toHaveTextContent(/^test-cancel$/);
  });

  it("handles action callbacks", async () => {
    const user = user_event.setup();
    const on_confirm = jest.fn();
    const on_cancel = jest.fn();

    const { getByTestId } = render_test_with_provider(
      <Confirmation
        description={"test"}
        on_cancel={on_cancel}
        on_confirm={on_confirm}
        open
        slot_props={
          {
            confirm_button: { "data-testid": "confirm-button" },
            cancel_button: { "data-testid": "cancel-button" }
          } as ConfirmationProps["slot_props"]
        }
        title={"test"}
      />
    );

    await user.click(getByTestId("confirm-button"));
    expect(on_confirm).toHaveBeenCalledTimes(1);
    await user.click(getByTestId("cancel-button"));
    expect(on_cancel).toHaveBeenCalledTimes(1);
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
            confirm_button: { "data-testid": "confirm-button" },
            cancel_button: { "data-testid": "cancel-button" },
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
