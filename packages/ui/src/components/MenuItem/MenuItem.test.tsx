import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menu from "../Menu";
import MenuItem from "./MenuItem";
import { MenuItemProps } from "./MenuItem.props";

describe("<MenuItem />", () => {
  it("renders", () => {
    const { getByRole } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menuitem")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem as={"aside"}>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menuitem").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          decorator={"Test"}
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
            } as MenuItemProps["slotProps"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          rightSlot={"Test"}
          slotProps={
            {
              rightSlot: { "data-testid": "right-slot" },
            } as MenuItemProps["slotProps"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          decorator={"Test"}
          rightSlot={"Test"}
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" },
            } as MenuItemProps["slotProps"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    ["decorator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
