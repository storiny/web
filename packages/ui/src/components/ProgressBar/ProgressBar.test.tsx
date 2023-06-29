import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ProgressBar from "./ProgressBar";
import styles from "./ProgressBar.module.scss";
import { ProgressBarProps, ProgressBarSize } from "./ProgressBar.props";

describe("<ProgressBar />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<ProgressBar value={64} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <ProgressBar aria-label={"Test"} value={64} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <ProgressBar as={"aside"} value={64} />
    );
    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` by default", () => {
    const { getByRole } = renderTestWithProvider(<ProgressBar value={64} />);
    expect(getByRole("progressbar")).toHaveClass(styles.md);
  });

  (["lg", "md"] as ProgressBarSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <ProgressBar size={size} value={64} />
      );
      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <ProgressBar
        slotProps={
          {
            indicator: { "data-testid": "indicator" },
          } as ProgressBarProps["slotProps"]
        }
        value={64}
      />
    );

    expect(getByTestId("indicator")).toBeInTheDocument();
  });
});
