import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Modal from "./Modal";
import styles from "./Modal.module.scss";
import { ModalProps } from "./Modal.props";

describe("<Modal />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(<Modal open />);
    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: { children: "Test" },
        }}
      />
    );

    await waitFor(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        as={"aside"}
        open
        slotProps={
          {
            content: { "data-testid": "content" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `default` mode by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        mode={"default"}
        open
        slotProps={
          {
            container: { "data-testid": "container" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).not.toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("renders trigger", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal open trigger={<span data-testid={"trigger"} />} />
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("renders footer", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal footer={<span data-testid={"footer"} />} open />
    );

    expect(getByTestId("footer")).toBeInTheDocument();
  });

  it("renders sidebar", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal open sidebar={<span data-testid={"sidebar"} />} />
    );

    expect(getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders in fullscreen", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        fullscreen
        open
        slotProps={
          {
            content: { "data-testid": "content" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(getByTestId("content")).toHaveClass(styles.fullscreen);
  });

  it("renders expected tabbed mode", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        mode={"tabbed"}
        open
        sidebar={<span />}
        slotProps={
          {
            container: { "data-testid": "container" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("skips rendering tabbed mode when sidebar is absent", () => {
    const { getByTestId } = renderTestWithProvider(
      <Modal
        mode={"tabbed"}
        open
        slotProps={
          {
            container: { "data-testid": "container" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).not.toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });

  it("hides close button", () => {
    const { queryByTestId } = renderTestWithProvider(
      <Modal
        hideCloseButton
        open
        slotProps={
          {
            closeButton: { "data-testid": "close-button" },
          } as ModalProps["slotProps"]
        }
      />
    );

    expect(queryByTestId("close-button")).not.toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId, baseElement } = renderTestWithProvider(
      <Modal
        footer={<span />}
        mode={"tabbed"}
        open
        sidebar={<span />}
        slotProps={
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
            closeButton: { "data-testid": "close-button" },
            tabs: { "data-tabs": "" },
          } as ModalProps["slotProps"]
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
      "close-button",
    ].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });

    // Passing data-testid to tabs slot overwrites
    // the test id passed to container slot.
    expect(baseElement.querySelector("[data-tabs]")).not.toBeNull();
  });
});
