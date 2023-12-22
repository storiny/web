import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

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

    expect(await axe(container)).toHaveNoViolations();
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

  it("passes props to the element slots", () => {
    const { getByTestId, getAllByTestId } = render_test_with_provider(
      <Spinner
        slot_props={
          {
            indicator: { "data-testid": "indicator" },
            bar: { "data-testid": "bar" }
          } as SpinnerProps["slot_props"]
        }
      />
    );

    expect(getByTestId("indicator")).toBeInTheDocument();
    expect(getAllByTestId("bar").length).toBeGreaterThan(0);
  });
});
