import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Menu from "../menu";
import MenuCheckboxItem from "./menu-checkbox-item";
import { MenuCheckboxItemProps } from "./menu-checkbox-item.props";

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
          right_slot={"Test"}
          slot_props={
            {
              right_slot: { "data-testid": "right-slot" }
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
          right_slot={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              right_slot: { "data-testid": "right-slot" },
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
