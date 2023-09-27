import { userEvent } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menu from "../Menu";
import MenuItem from "./MenuItem";
import { MenuItemProps } from "./MenuItem.props";

describe("<MenuItem />", () => {
  it("renders", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menuitem")).toBeInTheDocument();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem as={"aside"}>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menuitem").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          decorator={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" }
            } as MenuItemProps["slot_props"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders right slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          rightSlot={"Test"}
          slot_props={
            {
              rightSlot: { "data-testid": "right-slot" }
            } as MenuItemProps["slot_props"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("renders as an anchor with correct `href` when `checkAuth` is set to `true` and the user is logged out", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem checkAuth>Menu item</MenuItem>
      </Menu>
    );
    const menuItem = getByRole("menuitem");

    expect(menuItem.nodeName.toLowerCase()).toEqual("a");
    expect(menuItem).toHaveAttribute("href", "/login");
  });

  it("does not fire the click and select events when `checkAuth` is set to `true` and the user is logged out", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const onSelect = jest.fn();
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem checkAuth onClick={onClick} onSelect={onSelect}>
          Menu item
        </MenuItem>
      </Menu>
    );

    await user.click(getByRole("menuitem"));
    expect(onClick).toHaveBeenCalledTimes(0);
    expect(onSelect).toHaveBeenCalledTimes(0);
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          decorator={"Test"}
          rightSlot={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" }
            } as MenuItemProps["slot_props"]
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
