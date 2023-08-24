import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Popover from "./Popover";
import { PopoverProps } from "./Popover.props";

describe("<Popover />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Popover open trigger={<button>Trigger</button>}>
        Test
      </Popover>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <Popover open trigger={<button>Trigger</button>}>
        Test
      </Popover>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            "aria-dialog-name": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Popover as={"aside"} open trigger={<button>Trigger</button>}>
        Test
      </Popover>
    );

    expect(getByRole("dialog").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders trigger", () => {
    const { getByTestId } = renderTestWithProvider(
      <Popover open trigger={<span data-testid={"trigger"} />}>
        Test
      </Popover>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Popover
        open
        slotProps={
          {
            arrow: { "data-testid": "arrow" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" }
          } as PopoverProps["slotProps"]
        }
        trigger={<button>Trigger</button>}
      >
        Test
      </Popover>
    );

    ["arrow", "content", "trigger"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
