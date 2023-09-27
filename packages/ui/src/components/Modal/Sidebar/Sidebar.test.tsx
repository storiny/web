import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import ModalSidebar from "./Sidebar";

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

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
