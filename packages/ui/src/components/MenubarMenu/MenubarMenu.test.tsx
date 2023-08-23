import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menubar from "../Menubar";
import MenubarItem from "../MenubarItem";
import MenubarMenu from "./MenubarMenu";
import { MenubarMenuProps } from "./MenubarMenu.props";

describe("<MenubarMenu />", () => {
  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
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
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<span data-testid={"trigger"} />} value={"test"}>
          <MenubarItem>Test</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu
          slotProps={
            {
              arrow: { "data-testid": "arrow" },
              content: { "data-testid": "content" },
              trigger: { "data-testid": "trigger" }
            } as MenubarMenuProps["slotProps"]
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
