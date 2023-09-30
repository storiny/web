import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Skeleton from "./skeleton";
import styles from "./skeleton.module.scss";
import { SkeletonShape } from "./skeleton.props";

describe("<Skeleton />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Skeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Skeleton />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Skeleton as={"aside"} data-testid={"skeleton"} />
    );

    expect(getByTestId("skeleton").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders `rectangular` shape by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Skeleton data-testid={"skeleton"} />
    );

    expect(getByTestId("skeleton")).toHaveClass(styles.rectangular);
  });

  (["rectangular", "circular"] as SkeletonShape[]).forEach((shape) => {
    it(`renders \`${shape}\` shape`, () => {
      const { getByTestId } = render_test_with_provider(
        <Skeleton data-testid={"skeleton"} shape={shape} />
      );

      expect(getByTestId("skeleton")).toHaveClass(styles[shape]);
    });
  });

  it("renders with explicit width and height", () => {
    const { getByTestId } = render_test_with_provider(
      <Skeleton data-testid={"skeleton"} height={32} width={32} />
    );

    expect(getByTestId("skeleton")).toHaveStyle({
      "--width": "32px",
      "--height": "32px"
    });
  });
});
