import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Modal from "../modal";
import ModalFooterButton from "./footer-button";

describe("<ModalFooterButton />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Modal open>
        <ModalFooterButton>Test</ModalFooterButton>
      </Modal>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("renders `compact` version", () => {
    const { baseElement } = render_test_with_provider(
      <Modal open>
        <ModalFooterButton compact>Test</ModalFooterButton>
      </Modal>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Modal
        open
        slot_props={{
          header: { children: "Test" }
        }}
      >
        <ModalFooterButton>Test</ModalFooterButton>
      </Modal>
    );

    await wait_for(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });
});
