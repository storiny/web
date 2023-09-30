import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ModalSidebar from "./sidebar";

describe("<ModalSidebar />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <ModalSidebar>Test</ModalSidebar>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ModalSidebar>Test</ModalSidebar>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
