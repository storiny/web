import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menu from "../Menu";
import MenuCheckboxItem from "./MenuCheckboxItem";
import { MenuCheckboxItemProps } from "./MenuCheckboxItem.props";

describe("<MenuCheckboxItem />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem>Checkbox item</MenuCheckboxItem>
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByRole("menuitemcheckbox")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem as={"aside"}>Checkbox item</MenuCheckboxItem>
      </Menu>
    );

    expect(getByRole("menuitemcheckbox").nodeName.toLowerCase()).toEqual(
      "aside"
    );
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          decorator={"Test"}
          slotProps={
            {
              decorator: { "data-testid": "decorator" }
            } as MenuCheckboxItemProps["slotProps"]
          }
        >
          Test
        </MenuCheckboxItem>
      </Menu>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          rightSlot={"Test"}
          slotProps={
            {
              rightSlot: { "data-testid": "right-slot" }
            } as MenuCheckboxItemProps["slotProps"]
          }
        >
          Test
        </MenuCheckboxItem>
      </Menu>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          checked
          decorator={"Test"}
          rightSlot={"Test"}
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" },
              indicator: { "data-testid": "indicator" }
            } as MenuCheckboxItemProps["slotProps"]
          }
        >
          Test
        </MenuCheckboxItem>
      </Menu>
    );

    ["decorator", "indicator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
