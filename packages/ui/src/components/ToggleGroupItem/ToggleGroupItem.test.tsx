import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import toggleStyles from "../common/Toggle.module.scss";
import ToggleGroup from "../ToggleGroup";
import ToggleGroupItem from "./ToggleGroupItem";
import {
  ToggleGroupItemProps,
  ToggleGroupItemSize,
} from "./ToggleGroupItem.props";

describe("<ToggleGroupItem />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <ToggleGroup>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <ToggleGroup>
        <ToggleGroupItem as={"aside"} value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("radio").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders without tooltip and size `md` by default", async () => {
    const { getByRole, queryByRole } = renderTestWithProvider(
      <ToggleGroup>
        <ToggleGroupItem
          slotProps={{
            tooltip: { open: true },
          }}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await waitForPosition();

    expect(getByRole("radio")).toHaveClass(toggleStyles.md);
    expect(queryByRole("tooltip")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm", "xs"] as ToggleGroupItemSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <ToggleGroup>
          <ToggleGroupItem size={size} value={"test"}>
            Test
          </ToggleGroupItem>
        </ToggleGroup>
      );

      expect(getByRole("radio")).toHaveClass(toggleStyles[size]);
    });
  });

  it("infers size from ToggleGroup context", () => {
    const { getByRole } = renderTestWithProvider(
      <ToggleGroup size={"lg"}>
        <ToggleGroupItem value={"test"} />
      </ToggleGroup>
    );

    expect(getByRole("radio")).toHaveClass(toggleStyles.lg);
  });

  it("renders tooltip", async () => {
    const { getByRole } = renderTestWithProvider(
      <ToggleGroup>
        <ToggleGroupItem
          slotProps={{
            tooltip: { open: true },
          }}
          tooltipContent={"Tooltip content"}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await waitForPosition();

    expect(getByRole("tooltip")).toBeInTheDocument();
    expect(getByRole("tooltip")).toHaveTextContent("Tooltip content");
  });

  it("passes props to the element slots", async () => {
    const { getByTestId } = renderTestWithProvider(
      <ToggleGroup>
        <ToggleGroupItem
          slotProps={
            {
              tooltip: {
                open: true,
                slotProps: {
                  content: {
                    "data-testid": "tooltip-content",
                  },
                },
              },
              container: { "data-testid": "container" },
            } as ToggleGroupItemProps["slotProps"]
          }
          tooltipContent={"Tooltip content"}
          value={"test"}
        >
          Test
        </ToggleGroupItem>
      </ToggleGroup>
    );

    await waitForPosition();

    ["tooltip-content", "container"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
