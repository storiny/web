import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import CircularProgress from "./circular-progress";
import styles from "./circular-progress.module.scss";
import {
  CircularProgressColor,
  CircularProgressProps,
  CircularProgressSize
} from "./circular-progress.props";

describe("<CircularProgress />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<CircularProgress />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <CircularProgress aria-label={"Test circular progress"} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <CircularProgress as={"aside"} />
    );
    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByRole } = render_test_with_provider(<CircularProgress />);

    expect(getByRole("progressbar")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["lg", "md", "sm", "xs"] as CircularProgressSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <CircularProgress size={size} />
      );

      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as CircularProgressColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = render_test_with_provider(
        <CircularProgress color={color} />
      );

      expect(getByRole("progressbar")).toHaveClass(styles[color]);
    });
  });

  it("renders with progress value", () => {
    const { getByRole } = render_test_with_provider(
      <CircularProgress value={50} />
    );

    expect(getByRole("progressbar")).toHaveAttribute("data-state", "loading");
  });

  it("renders nested children", () => {
    const { getByTestId } = render_test_with_provider(
      <CircularProgress>
        <span data-testid={"child"} />
      </CircularProgress>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <CircularProgress
        slot_props={
          {
            indicator: { "data-testid": "indicator" },
            svg: { "data-testid": "svg" },
            progress: { "data-testid": "progress" },
            track: { "data-testid": "track" }
          } as CircularProgressProps["slot_props"]
        }
      />
    );

    ["indicator", "svg", "progress", "track"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
