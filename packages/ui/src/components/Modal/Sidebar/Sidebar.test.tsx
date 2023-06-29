import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ModalSidebar from "./Sidebar";

describe("<ModalSidebar />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <ModalSidebar>Test</ModalSidebar>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <ModalSidebar>Test</ModalSidebar>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
