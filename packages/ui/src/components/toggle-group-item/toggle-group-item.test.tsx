import { wait_for_position } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import toggle_styles from "../common/toggle.module.scss";
import ToggleGroup from "../toggle-group";
import ToggleGroupItem from "./toggle-group-item";
import {
  ToggleGroupItemProps,
  ToggleGroupItemSize
} from "./toggle-group-item.props";

describe("<ToggleGroupItem />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem as={"aside"} value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("radio").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders without tooltip and size `md` by default", async () => {
    const { getByRole, queryByRole } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem
          slot_props={{
            tooltip: { open: true }
          }}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await wait_for_position();

    expect(getByRole("radio")).toHaveClass(toggle_styles.md);
    expect(queryByRole("tooltip")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm", "xs"] as ToggleGroupItemSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <ToggleGroup>
          <ToggleGroupItem size={size} value={"test"}>
            Test
          </ToggleGroupItem>
        </ToggleGroup>
      );

      expect(getByRole("radio")).toHaveClass(toggle_styles[size]);
    });
  });

  it("infers size from ToggleGroup context", () => {
    const { getByRole } = render_test_with_provider(
      <ToggleGroup size={"lg"}>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("radio")).toHaveClass(toggle_styles.lg);
  });

  it("renders tooltip", async () => {
    const { getByRole } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem
          slot_props={{
            tooltip: { open: true }
          }}
          tooltip_content={"Tooltip content"}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await wait_for_position();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(getByRole("tooltip")).toHaveTextContent("Tooltip content");
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = render_test_with_provider(
      <ToggleGroup>
        <ToggleGroupItem
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
            } as ToggleGroupItemProps["slot_props"]
          }
          tooltip_content={"Tooltip content"}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await wait_for_position();

    ["tooltip-content", "container"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
