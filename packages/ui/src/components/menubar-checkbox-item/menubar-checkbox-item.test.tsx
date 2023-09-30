import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Menubar from "../menubar";
import MenubarMenu from "../menubar-menu";
import MenubarCheckboxItem from "./menubar-checkbox-item";
import { MenubarCheckboxItemProps } from "./menubar-checkbox-item.props";

describe("<MenubarCheckboxItem />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem>Checkbox item</MenubarCheckboxItem>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByRole("menuitemcheckbox")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            decorator={"Test"}
            slot_props={
              {
                decorator: { "data-testid": "decorator" }
              } as MenubarCheckboxItemProps["slot_props"]
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
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            right_slot={"Test"}
            slot_props={
              {
                right_slot: { "data-testid": "right-slot" }
              } as MenubarCheckboxItemProps["slot_props"]
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
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarCheckboxItem
            checked
            decorator={"Test"}
            right_slot={"Test"}
            slot_props={
              {
                decorator: { "data-testid": "decorator" },
                right_slot: { "data-testid": "right-slot" },
                indicator: { "data-testid": "indicator" }
              } as MenubarCheckboxItemProps["slot_props"]
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
