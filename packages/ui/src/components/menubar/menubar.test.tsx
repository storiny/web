import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import MenubarItem from "../menubar-item";
import MenubarMenu from "../menubar-menu";
import Menubar from "./menubar";

describe("<Menubar />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    await wait_for(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-allowed-attr": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menubar as={"aside"} value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menubar").nodeName.toLowerCase()).toEqual("aside");
  });
});
