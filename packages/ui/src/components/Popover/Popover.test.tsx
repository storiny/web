import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Popover from "./Popover";
import { PopoverProps } from "./Popover.props";

describe("<Popover />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Popover open trigger={<button>Trigger</button>}>
        Test
      </Popover>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
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
    const { getByRole } = render_test_with_provider(
      <Popover as={"aside"} open trigger={<button>Trigger</button>}>
        Test
      </Popover>
    );

    expect(getByRole("dialog").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders trigger", () => {
    const { getByTestId } = render_test_with_provider(
      <Popover open trigger={<span data-testid={"trigger"} />}>
        Test
      </Popover>
    );

    expect(getByTestId("trigger")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Popover
        open
        slot_props={
          {
            arrow: { "data-testid": "arrow" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" }
          } as PopoverProps["slot_props"]
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
