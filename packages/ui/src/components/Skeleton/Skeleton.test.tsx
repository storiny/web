import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Skeleton from "./Skeleton";
import styles from "./Skeleton.module.scss";
import { SkeletonShape } from "./Skeleton.props";

describe("<Skeleton />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Skeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Skeleton />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Skeleton as={"aside"} data-testid={"skeleton"} />
    );

    expect(getByTestId("skeleton").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `rectangular` shape by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Skeleton data-testid={"skeleton"} />
    );

    expect(getByTestId("skeleton")).toHaveClass(styles.rectangular);
  });

  (["rectangular", "circular"] as SkeletonShape[]).forEach((shape) => {
    it(`renders \`${shape}\` shape`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Skeleton data-testid={"skeleton"} shape={shape} />
      );

      expect(getByTestId("skeleton")).toHaveClass(styles[shape]);
    });
  });

  it("renders with explicit width and height", () => {
    const { getByTestId } = renderTestWithProvider(
      <Skeleton data-testid={"skeleton"} height={32} width={32} />
    );

    expect(getByTestId("skeleton")).toHaveStyle({
      "--width": "32px",
      "--height": "32px"
    });
  });
});
