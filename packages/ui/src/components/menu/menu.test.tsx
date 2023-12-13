import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import styles from "../common/menu.module.scss";
import MenuItem from "../menu-item";
import Menu from "./";
import { MenuProps, MenuSize } from "./menu.props";

describe("<Menu />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(
      await axe(baseElement, {
        rules: {
          region: { enabled: false },
          "aria-allowed-attr": { enabled: false }
        }
      })
    ).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Menu as={"aside"} open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menu").nodeName.toLowerCase()).toEqual("aside");
  });

  (["md", "sm"] as MenuSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <Menu open size={size} trigger={<button>Trigger</button>}>
          <MenuItem>Test</MenuItem>
        </Menu>
      );

      expect(getByRole("menu")).toHaveClass(styles[size]);
    });
  });

  it("renders trigger", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu open trigger={<span data-testid={"trigger"} />}>
        <MenuItem>Test</MenuItem>
      </Menu>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Menu
        open
        slot_props={
          {
            arrow: { "data-testid": "arrow" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" }
          } as MenuProps["slot_props"]
        }
        trigger={<button>Trigger</button>}
      >
        <MenuItem>Test</MenuItem>
      </Menu>
    );

    ["arrow", "content", "trigger"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
