import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import ScrollArea from "./ScrollArea";
import styles from "./ScrollArea.module.scss";
import { ScrollAreaProps, ScrollAreaSize } from "./ScrollArea.props";

describe("<ScrollArea />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <ScrollArea enableHorizontal type={"always"}>
        Test
      </ScrollArea>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ScrollArea>Test</ScrollArea>
    );
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <ScrollArea as={"aside"} data-testid={"scroll-area"}>
        Test
      </ScrollArea>
    );

    expect(getByTestId("scroll-area").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders only vertical scrollbar and size `md` by default", () => {
    const { getByTestId, queryAllByTestId } = render_test_with_provider(
      <ScrollArea
        data-testid={"scroll-area"}
        slot_props={
          {
            scrollbar: { "data-testid": "scrollbar" }
          } as ScrollAreaProps["slot_props"]
        }
        type={"always"}
      >
        Test
      </ScrollArea>
    );

    const scrollbars = queryAllByTestId("scrollbar");

    expect(scrollbars.length).toEqual(1);
    expect(scrollbars[0]).toHaveAttribute("data-orientation", "vertical");
    expect(getByTestId("scroll-area")).toHaveClass(styles.md);
  });

  (["lg", "md"] as ScrollAreaSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <ScrollArea data-testid={"scroll-area"} size={size}>
          Test
        </ScrollArea>
      );

      expect(getByTestId("scroll-area")).toHaveClass(styles[size]);
    });
  });

  it("renders horizontal scrollbar", () => {
    const { queryAllByTestId } = render_test_with_provider(
      <ScrollArea
        enableHorizontal
        slot_props={
          {
            scrollbar: { "data-testid": "scrollbar" }
          } as ScrollAreaProps["slot_props"]
        }
        type={"always"}
      >
        Test
      </ScrollArea>
    );

    expect(queryAllByTestId("scrollbar").length).toEqual(2);
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <ScrollArea
        slot_props={
          {
            viewport: { "data-testid": "viewport" },
            scrollbar: { "data-testid": "scrollbar" }
          } as ScrollAreaProps["slot_props"]
        }
        type={"always"}
      />
    );

    ["viewport", "scrollbar"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
