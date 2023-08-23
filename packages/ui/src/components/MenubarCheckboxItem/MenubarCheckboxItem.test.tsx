import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menubar from "../Menubar";
import MenubarMenu from "../MenubarMenu";
import MenubarCheckboxItem from "./MenubarCheckboxItem";
import { MenubarCheckboxItemProps } from "./MenubarCheckboxItem.props";

describe("<MenubarCheckboxItem />", () => {
  it("renders", () => {
    const { getByRole } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem>Checkbox item</MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menuitemcheckbox")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem as={"aside"}>Checkbox item</MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menuitemcheckbox").nodeName.toLowerCase()).toEqual(
      "aside"
    );
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            decorator={"Test"}
            slotProps={
              {
                decorator: { "data-testid": "decorator" }
              } as MenubarCheckboxItemProps["slotProps"]
            }
          >
            Test
          </MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            rightSlot={"Test"}
            slotProps={
              {
                rightSlot: { "data-testid": "right-slot" }
              } as MenubarCheckboxItemProps["slotProps"]
            }
          >
            Test
          </MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            checked
            decorator={"Test"}
            rightSlot={"Test"}
            slotProps={
              {
                decorator: { "data-testid": "decorator" },
                rightSlot: { "data-testid": "right-slot" },
                indicator: { "data-testid": "indicator" }
              } as MenubarCheckboxItemProps["slotProps"]
            }
          >
            Test
          </MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    ["decorator", "indicator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
