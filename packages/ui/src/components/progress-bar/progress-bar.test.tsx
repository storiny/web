import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ProgressBar from "./progress-bar";
import styles from "./progress-bar.module.scss";
import { ProgressBarProps, ProgressBarSize } from "./progress-bar.props";

describe("<ProgressBar />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<ProgressBar value={64} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ProgressBar aria-label={"Test"} value={64} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <ProgressBar as={"aside"} value={64} />
    );
    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` by default", () => {
    const { getByRole } = render_test_with_provider(<ProgressBar value={64} />);
    expect(getByRole("progressbar")).toHaveClass(styles.md);
  });

  (["lg", "md"] as ProgressBarSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <ProgressBar size={size} value={64} />
      );
      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <ProgressBar
        slot_props={
          {
            indicator: { "data-testid": "indicator" }
          } as ProgressBarProps["slot_props"]
        }
        value={64}
      />
    );

    expect(getByTestId("indicator")).toBeInTheDocument();
  });
});
