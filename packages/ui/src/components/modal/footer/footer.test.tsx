import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ModalFooter from "./footer";

describe("<ModalFooter />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <ModalFooter>Test</ModalFooter>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders `compact` version", () => {
    const { container } = render_test_with_provider(
      <ModalFooter compact>Test</ModalFooter>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ModalFooter>Test</ModalFooter>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
