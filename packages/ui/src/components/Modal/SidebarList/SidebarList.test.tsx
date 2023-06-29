import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tabs from "../../Tabs";
import ModalSidebarList from "./SidebarList";

describe("<ModalSidebarList />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList />
      </Tabs>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Tabs>
        <ModalSidebarList />
      </Tabs>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
