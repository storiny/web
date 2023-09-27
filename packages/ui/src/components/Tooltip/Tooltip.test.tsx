import { TooltipProvider } from "@radix-ui/react-tooltip";
import { axe, waitForPosition } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Tooltip from "./Tooltip";
import { TooltipProps } from "./Tooltip.props";

describe("<Tooltip />", () => {
  it("matches snapshot", async () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Tooltip content={"Tooltip content"} open>
        Test
      </Tooltip>
    );

    await waitForPosition();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <Tooltip
        as={"aside"}
        content={"Tooltip content"}
        open
        slot_props={
          {
            content: {
              "data-testid": "content"
            }
          } as TooltipProps["slot_props"]
        }
      >
        Test
      </Tooltip>
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders right slot", async () => {
    const { getAllByTestId } = render_test_with_provider(
      <Tooltip
        content={"Tooltip content"}
        open
        rightSlot={<span data-testid={"right-slot"} />}
      >
        Test
      </Tooltip>
    );

    expect(getAllByTestId("right-slot").length).not.toEqual(0);
  });

  it("passes props to the element slots", async () => {
    const { getByTestId, getAllByTestId } = render_test_with_provider(
      <TooltipProvider delayDuration={0}>
        <Tooltip
          content={"Tooltip content"}
          open
          rightSlot={"Test"}
          slot_props={
            {
              arrow: { "data-testid": "arrow" },
              content: { "data-testid": "content" },
              rightSlot: { "data-testid": "right-slot" }
            } as TooltipProps["slot_props"]
          }
        >
          Test
        </Tooltip>
      </TooltipProvider>
    );

    await waitForPosition();

    expect(getAllByTestId("right-slot").length).not.toEqual(0);
    ["arrow", "content"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
