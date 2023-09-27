import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menubar from "../Menubar";
import MenubarMenu from "../MenubarMenu";
import MenubarRadioGroup from "../MenubarRadioGroup";
import MenubarRadioItem from "./MenubarRadioItem";
import { MenubarRadioItemProps } from "./MenubarRadioItem.props";

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
              rightSlot={"Test"}
              slot_props={
                {
                  rightSlot: { "data-testid": "right-slot" }
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
              rightSlot={"Test"}
              slot_props={
                {
                  decorator: { "data-testid": "decorator" },
                  rightSlot: { "data-testid": "right-slot" },
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
