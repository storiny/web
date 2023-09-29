import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Spinner from "./spinner";
import styles from "./spinner.module.scss";
import { SpinnerColor, SpinnerProps, SpinnerSize } from "./spinner.props";

describe("<Spinner />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Spinner />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Spinner aria-label={"Test spinner"} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(<Spinner as={"aside"} />);
    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByRole } = render_test_with_provider(<Spinner />);

    expect(getByRole("progressbar")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["lg", "md", "sm", "xs"] as SpinnerSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(<Spinner size={size} />);
      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as SpinnerColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = render_test_with_provider(
        <Spinner color={color} />
      );
      expect(getByRole("progressbar")).toHaveClass(styles[color]);
    });
  });

  it("renders determinate variant", () => {
    const { getByRole } = render_test_with_provider(<Spinner value={50} />);
    expect(getByRole("progressbar")).toHaveAttribute("data-state", "loading");
  });

  it("renders nested children", () => {
    const { getByTestId } = render_test_with_provider(
      <Spinner>
        <span data-testid={"child"} />
      </Spinner>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Spinner
        slot_props={
          {
            indicator: { "data-testid": "indicator" },
            svg: { "data-testid": "svg" },
            progress: { "data-testid": "progress" },
            track: { "data-testid": "track" }
          } as SpinnerProps["slot_props"]
        }
      />
    );

    ["indicator", "svg", "progress", "track"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
