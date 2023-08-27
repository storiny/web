import { TooltipProvider } from "@radix-ui/react-tooltip";
import { axe, waitForPosition } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tooltip from "./Tooltip";
import { TooltipProps } from "./Tooltip.props";

describe("<Tooltip />", () => {
  it("matches snapshot", async () => {
    const { baseElement, getByRole } = renderTestWithProvider(
      <Tooltip content={"Tooltip content"} open>
        Test
      </Tooltip>
    );

    await waitForPosition();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <TooltipProvider delayDuration={0}>
        <Tooltip content={"Tooltip content"} open>
          Test
        </Tooltip>
      </TooltipProvider>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            region: { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Tooltip
        as={"aside"}
        content={"Tooltip content"}
        open
        slotProps={
          {
            content: {
              "data-testid": "content"
            }
          } as TooltipProps["slotProps"]
        }
      >
        Test
      </Tooltip>
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders right slot", async () => {
    const { getByTestId } = renderTestWithProvider(
      <Tooltip
        content={"Tooltip content"}
        open
        rightSlot={<span data-testid={"right-slot"} />}
      >
        Test
      </Tooltip>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = renderTestWithProvider(
      <TooltipProvider delayDuration={0}>
        <Tooltip
          content={"Tooltip content"}
          open
          slotProps={
            {
              arrow: { "data-testid": "arrow" },
              content: { "data-testid": "content" },
              rightSlot: { "data-testid": "right-slot" }
            } as TooltipProps["slotProps"]
          }
        >
          Test
        </Tooltip>
      </TooltipProvider>
    );

    await waitForPosition();

    ["arrow", "content", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
