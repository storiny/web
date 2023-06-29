import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Modal from "../Modal";
import ModalFooterButton from "./FooterButton";

describe("<ModalFooterButton />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Modal open>
        <ModalFooterButton>Test</ModalFooterButton>
      </Modal>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Modal
        open
        slotProps={{
          header: { children: "Test" },
        }}
      >
        <ModalFooterButton>Test</ModalFooterButton>
      </Modal>
    );

    await waitFor(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });
});
