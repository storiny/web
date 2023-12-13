import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Tabs from "../../tabs";
import ModalSidebarList from "./sidebar-list";

describe("<ModalSidebarList />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <ModalSidebarList />
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Tabs>
        <ModalSidebarList />
      </Tabs>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
