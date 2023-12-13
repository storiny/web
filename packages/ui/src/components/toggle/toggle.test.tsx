import { axe, wait_for_position } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import toggle_styles from "../common/toggle.module.scss";
import Toggle from "./toggle";
import { ToggleProps, ToggleSize } from "./toggle.props";

describe("<Toggle />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Toggle>Test</Toggle>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Toggle>Test</Toggle>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders without tooltip and size `md` by default", async () => {
    const { getByRole, queryByRole } = render_test_with_provider(
      <Toggle
        slot_props={{
          tooltip: { open: true }
        }}
      >
        Test
      </Toggle>
    );

    await wait_for_position();

    expect(getByRole("button")).toHaveClass(toggle_styles.md);
    expect(queryByRole("tooltip")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm", "xs"] as ToggleSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <Toggle size={size}>Test</Toggle>
      );

      expect(getByRole("button")).toHaveClass(toggle_styles[size]);
    });
  });

  it("renders tooltip", async () => {
    const { getByRole } = render_test_with_provider(
      <Toggle
        slot_props={{
          tooltip: { open: true }
        }}
        tooltip_content={"Tooltip content"}
      >
        Test
      </Toggle>
    );

    await wait_for_position();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(getByRole("tooltip")).toHaveTextContent("Tooltip content");
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = render_test_with_provider(
      <Toggle
        slot_props={
          {
            tooltip: {
              open: true,
              slot_props: {
                content: {
                  "data-testid": "tooltip-content"
                }
              }
            },
            container: { "data-testid": "container" }
          } as ToggleProps["slot_props"]
        }
        tooltip_content={"Tooltip content"}
      >
        Test
      </Toggle>
    );

    await wait_for_position();

    ["tooltip-content", "container"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
