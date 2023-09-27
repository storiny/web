import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menu from "../Menu";
import MenuCheckboxItem from "./MenuCheckboxItem";
import { MenuCheckboxItemProps } from "./MenuCheckboxItem.props";

describe("<MenuCheckboxItem />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem>Checkbox item</MenuCheckboxItem>
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByRole("menuitemcheckbox")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem as={"aside"}>Checkbox item</MenuCheckboxItem>
      </Menu>
    );

    expect(getByRole("menuitemcheckbox").nodeName.toLowerCase()).toEqual(
      "aside"
    );
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          decorator={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" }
            } as MenuCheckboxItemProps["slot_props"]
          }
        >
          Test
        </MenuCheckboxItem>
      </Menu>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          rightSlot={"Test"}
          slot_props={
            {
              rightSlot: { "data-testid": "right-slot" }
            } as MenuCheckboxItemProps["slot_props"]
          }
        >
          Test
        </MenuCheckboxItem>
      </Menu>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuCheckboxItem
          checked
          decorator={"Test"}
          rightSlot={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" },
              indicator: { "data-testid": "indicator" }
            } as MenuCheckboxItemProps["slot_props"]
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
