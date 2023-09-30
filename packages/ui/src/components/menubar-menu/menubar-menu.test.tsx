import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Menubar from "../menubar";
import MenubarItem from "../menubar-item";
import MenubarMenu from "./menubar-menu";
import { MenubarMenuProps } from "./menubar-menu.props";

describe("<MenubarMenu />", () => {
  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu
          as={"aside"}
          trigger={<button>Trigger</button>}
          value={"test"}
        >
          <MenubarItem>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menu").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders trigger", () => {
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<span data-testid={"trigger"} />} value={"test"}>
          <MenubarItem>Test</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu
          slot_props={
            {
              arrow: { "data-testid": "arrow" },
              content: { "data-testid": "content" },
              trigger: { "data-testid": "trigger" }
            } as MenubarMenuProps["slot_props"]
          }
          trigger={<button>Trigger</button>}
          value={"test"}
        >
          <MenubarItem>Test</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    ["arrow", "content", "trigger"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
