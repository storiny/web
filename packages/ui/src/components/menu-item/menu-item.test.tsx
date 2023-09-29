import { userEvent as user_event } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Menu from "../menu";
import MenuItem from "./menu-item";
import { MenuItemProps } from "./menu-item.props";

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
          right_slot={"Test"}
          slot_props={
            {
              right_slot: { "data-testid": "right-slot" }
            } as MenuItemProps["slot_props"]
          }
        >
          Test
        </MenuItem>
      </Menu>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("renders as an anchor with correct `href` when `check_auth` is set to `true` and the user is logged out", () => {
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem check_auth>Menu item</MenuItem>
      </Menu>
    );
    const menu_item = getByRole("menuitem");

    expect(menu_item.nodeName.toLowerCase()).toEqual("a");
    expect(menu_item).toHaveAttribute("href", "/login");
  });

  it("does not fire the click and select events when `check_auth` is set to `true` and the user is logged out", async () => {
    const user = user_event.setup();
    const on_click = jest.fn();
    const on_select = jest.fn();
    const { getByRole } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem check_auth onClick={on_click} onSelect={on_select}>
          Menu item
        </MenuItem>
      </Menu>
    );

    await user.click(getByRole("menuitem"));
    expect(on_click).toHaveBeenCalledTimes(0);
    expect(on_select).toHaveBeenCalledTimes(0);
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem
          decorator={"Test"}
          right_slot={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              right_slot: { "data-testid": "right-slot" }
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
