import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Menu from "../Menu";
import MenuItem from "../MenuItem";
import styles from "./Menu.module.scss";
import { MenuProps, MenuSize } from "./Menu.props";

describe("<Menu />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Menu open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false },
            "aria-allowed-attr": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Menu as={"aside"} open trigger={<button>Trigger</button>}>
        <MenuItem>Menu item</MenuItem>
      </Menu>
    );

    expect(getByRole("menu").nodeName.toLowerCase()).toEqual("aside");
  });

  (["md", "sm"] as MenuSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <Menu open size={size} trigger={<button>Trigger</button>}>
          <MenuItem>Test</MenuItem>
        </Menu>
      );

      expect(getByRole("menu")).toHaveClass(styles[size]);
    });
  });

  it("renders trigger", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu open trigger={<span data-testid={"trigger"} />}>
        <MenuItem>Test</MenuItem>
      </Menu>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Menu
        open
        slotProps={
          {
            arrow: { "data-testid": "arrow" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" }
          } as MenuProps["slotProps"]
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
