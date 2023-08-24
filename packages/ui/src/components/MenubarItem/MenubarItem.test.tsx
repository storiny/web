import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menubar from "../Menubar";
import MenubarMenu from "../MenubarMenu";
import MenubarItem from "./MenubarItem";
import { MenubarItemProps } from "./MenubarItem.props";

describe("<MenubarItem />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem data-testid={"item"}>Menubar item</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("item")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem as={"aside"} data-testid={"item"}>
            Menubar item
          </MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("item").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem
            decorator={"Test"}
            slotProps={
              {
                decorator: { "data-testid": "decorator" }
              } as MenubarItemProps["slotProps"]
            }
          >
            Test
          </MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem
            rightSlot={"Test"}
            slotProps={
              {
                rightSlot: { "data-testid": "right-slot" }
              } as MenubarItemProps["slotProps"]
            }
          >
            Test
          </MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarItem
            decorator={"Test"}
            rightSlot={"Test"}
            slotProps={
              {
                decorator: { "data-testid": "decorator" },
                rightSlot: { "data-testid": "right-slot" }
              } as MenubarItemProps["slotProps"]
            }
          >
            Test
          </MenubarItem>
        </MenubarMenu>
      </Menubar>
    );

    ["decorator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
