import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Modal from "./modal";
import styles from "./modal.module.scss";
import { ModalProps } from "./modal.props";

describe("<Modal />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(<Modal open />);
    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: { children: "Test" }
        }}
      />
    );

    await wait_for(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        as={"aside"}
        open
        slot_props={
          {
            content: { "data-testid": "content" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `default` mode by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        mode={"default"}
        open
        slot_props={
          {
            container: { "data-testid": "container" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container")).not.toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("renders trigger", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal open trigger={<span data-testid={"trigger"} />} />
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("renders footer", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal footer={<span data-testid={"footer"} />} open />
    );

    expect(getByTestId("footer")).toBeInTheDocument();
  });

  it("renders sidebar", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal open sidebar={<span data-testid={"sidebar"} />} />
    );

    expect(getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders in fullscreen", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        fullscreen
        open
        slot_props={
          {
            content: { "data-testid": "content" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(getByTestId("content")).toHaveClass(styles.fullscreen);
  });

  it("renders expected tabbed mode", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        mode={"tabbed"}
        open
        sidebar={<span />}
        slot_props={
          {
            container: { "data-testid": "container" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container")).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("skips rendering tabbed mode when sidebar is absent", () => {
    const { getByTestId } = render_test_with_provider(
      <Modal
        mode={"tabbed"}
        open
        slot_props={
          {
            container: { "data-testid": "container" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container")).not.toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("hides close button", () => {
    const { queryByTestId } = render_test_with_provider(
      <Modal
        hide_close_button
        open
        slot_props={
          {
            close_button: { "data-testid": "close-button" }
          } as ModalProps["slot_props"]
        }
      />
    );

    expect(queryByTestId("close-button")).not.toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId, baseElement } = render_test_with_provider(
      <Modal
        footer={<span />}
        mode={"tabbed"}
        open
        sidebar={<span />}
        slot_props={
          {
            container: { "data-testid": "container" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" },
            body: { "data-testid": "body" },
            footer: { "data-testid": "footer" },
            header: { "data-testid": "header" },
            sidebar: { "data-testid": "sidebar" },
            main: { "data-testid": "main" },
            overlay: { "data-testid": "overlay" },
            close_button: { "data-testid": "close-button" },
            tabs: { "data-tabs": "" }
          } as ModalProps["slot_props"]
        }
        trigger={<button>Trigger</button>}
      >
        Test
      </Modal>
    );

    [
      "container",
      "content",
      "trigger",
      "body",
      "footer",
      "header",
      "sidebar",
      "main",
      "overlay",
      "close-button"
    ].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });

    // Passing data-testid to tabs slot overwrites the test id passed to container slot.
    expect(baseElement.querySelector("[data-tabs]")).not.toBeNull();
  });
});
