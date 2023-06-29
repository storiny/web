import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Spinner from "./Spinner";
import styles from "./Spinner.module.scss";
import { SpinnerColor, SpinnerProps, SpinnerSize } from "./Spinner.props";

describe("<Spinner />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Spinner />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Spinner aria-label={"Test spinner"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(<Spinner as={"aside"} />);
    expect(getByRole("progressbar").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByRole } = renderTestWithProvider(<Spinner />);

    expect(getByRole("progressbar")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["lg", "md", "sm", "xs"] as SpinnerSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(<Spinner size={size} />);
      expect(getByRole("progressbar")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as SpinnerColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = renderTestWithProvider(<Spinner color={color} />);
      expect(getByRole("progressbar")).toHaveClass(styles[color]);
    });
  });

  it("renders determinate variant", () => {
    const { getByRole } = renderTestWithProvider(<Spinner value={50} />);
    expect(getByRole("progressbar")).toHaveAttribute("data-state", "loading");
  });

  it("renders nested children", () => {
    const { getByTestId } = renderTestWithProvider(
      <Spinner>
        <span data-testid={"child"} />
      </Spinner>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Spinner
        slotProps={
          {
            indicator: { "data-testid": "indicator" },
            svg: { "data-testid": "svg" },
            progress: { "data-testid": "progress" },
            track: { "data-testid": "track" },
          } as SpinnerProps["slotProps"]
        }
      />
    );

    ["indicator", "svg", "progress", "track"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
