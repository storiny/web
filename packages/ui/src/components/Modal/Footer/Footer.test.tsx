import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ModalFooter from "./Footer";

describe("<ModalFooter />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <ModalFooter>Test</ModalFooter>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders `compact` version", () => {
    const { container } = renderTestWithProvider(
      <ModalFooter compact>Test</ModalFooter>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <ModalFooter>Test</ModalFooter>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
