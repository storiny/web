import { axe, waitForPosition } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import toggleStyles from "../common/Toggle.module.scss";
import Toggle from "./Toggle";
import { ToggleProps, ToggleSize } from "./Toggle.props";

describe("<Toggle />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Toggle>Test</Toggle>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Toggle>Test</Toggle>);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders without tooltip and size `md` by default", async () => {
    const { getByRole, queryByRole } = renderTestWithProvider(
      <Toggle
        slotProps={{
          tooltip: { open: true }
        }}
      >
        Test
      </Toggle>
    );

    await waitForPosition();

    expect(getByRole("button")).toHaveClass(toggleStyles.md);
    expect(queryByRole("tooltip")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm", "xs"] as ToggleSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <Toggle size={size}>Test</Toggle>
      );

      expect(getByRole("button")).toHaveClass(toggleStyles[size]);
    });
  });

  it("renders tooltip", async () => {
    const { getByRole } = renderTestWithProvider(
      <Toggle
        slotProps={{
          tooltip: { open: true }
        }}
        tooltipContent={"Tooltip content"}
      >
        Test
      </Toggle>
    );

    await waitForPosition();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(getByRole("tooltip")).toHaveTextContent("Tooltip content");
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Toggle
        slotProps={
          {
            tooltip: {
              open: true,
              slotProps: {
                content: {
                  "data-testid": "tooltip-content"
                }
              }
            },
            container: { "data-testid": "container" }
          } as ToggleProps["slotProps"]
        }
        tooltipContent={"Tooltip content"}
      >
        Test
      </Toggle>
    );

    await waitForPosition();

    ["tooltip-content", "container"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
