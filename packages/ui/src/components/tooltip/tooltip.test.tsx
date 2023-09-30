import { TooltipProvider } from "@radix-ui/react-tooltip";
import { axe, wait_for_position } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Tooltip from "./tooltip";
import { TooltipProps } from "./tooltip.props";

describe("<Tooltip />", () => {
  it("matches snapshot", async () => {
    const { baseElement, getByRole } = render_test_with_provider(
      <Tooltip content={"Tooltip content"} open>
        Test
      </Tooltip>
    );

    await wait_for_position();

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

    await wait_for(async () =>
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
        right_slot={<span data-testid={"right-slot"} />}
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
          right_slot={"Test"}
          slot_props={
            {
              arrow: { "data-testid": "arrow" },
              content: { "data-testid": "content" },
              right_slot: { "data-testid": "right-slot" }
            } as TooltipProps["slot_props"]
          }
        >
          Test
        </Tooltip>
      </TooltipProvider>
    );

    await wait_for_position();

    expect(getAllByTestId("right-slot").length).not.toEqual(0);
    ["arrow", "content"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
