import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

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

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
