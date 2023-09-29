import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menubar from "../menubar";
import MenubarMenu from "../menubar-menu";
import MenubarRadioGroup from "../menubar-radio-group";
import MenubarRadioItem from "./menubar-radio-item";
import { MenubarRadioItemProps } from "./menubar-radio-item.props";

describe("<MenubarRadioItem />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup>
            <MenubarRadioItem value={"test"}>Radio item</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByRole("menuitemradio")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup>
            <MenubarRadioItem as={"aside"} value={"test"}>
              Radio item
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByRole("menuitemradio").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup>
            <MenubarRadioItem
              decorator={"Test"}
              slot_props={
                {
                  decorator: { "data-testid": "decorator" }
                } as MenubarRadioItemProps["slot_props"]
              }
              value={"test"}
            >
              Radio item
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup>
            <MenubarRadioItem
              right_slot={"Test"}
              slot_props={
                {
                  right_slot: { "data-testid": "right-slot" }
                } as MenubarRadioItemProps["slot_props"]
              }
              value={"test"}
            >
              Radio item
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menubar value={"test"}>
        <MenubarMenu trigger={<button>Trigger</button>} value={"test"}>
          <MenubarRadioGroup value={"test"}>
            <MenubarRadioItem
              decorator={"Test"}
              right_slot={"Test"}
              slot_props={
                {
                  decorator: { "data-testid": "decorator" },
                  right_slot: { "data-testid": "right-slot" },
                  indicator: { "data-testid": "indicator" }
                } as MenubarRadioItemProps["slot_props"]
              }
              value={"test"}
            >
              Radio item
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
      </Menubar>
    );

    ["decorator", "indicator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
