import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Checkbox from "./Checkbox";
import styles from "./Checkbox.module.scss";
import { CheckboxColor, CheckboxProps, CheckboxSize } from "./Checkbox.props";

describe("<Checkbox />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Checkbox label={"Test"} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Checkbox label={"Test"} />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Checkbox data-testid={"checkbox"} label={"Test"} />
    );
    expect(getByTestId("checkbox")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["inverted", "ruby"] as CheckboxColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Checkbox color={color} data-testid={"checkbox"} />
      );

      expect(getByTestId("checkbox")).toHaveClass(styles[color]);
    });
  });

  (["lg", "md"] as CheckboxSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Checkbox data-testid={"checkbox"} size={size} />
      );

      expect(getByTestId("checkbox")).toHaveClass(styles[size]);
    });
  });

  it("renders label", () => {
    const { getByTestId } = renderTestWithProvider(
      <Checkbox
        label={"Test"}
        slotProps={
          { label: { "data-testid": "label" } } as CheckboxProps["slotProps"]
        }
      />
    );

    expect(getByTestId("label")).toHaveTextContent(/^Test$/);
  });

  it("passes the same id to input and label", () => {
    const { getByTestId } = renderTestWithProvider(
      <Checkbox
        data-testid={"checkbox"}
        label={"Test"}
        slotProps={
          { label: { "data-testid": "label" } } as CheckboxProps["slotProps"]
        }
      />
    );

    expect(getByTestId("checkbox")).toHaveAttribute(
      "id",
      getByTestId("label").getAttribute("for")
    );
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Checkbox
        checked
        label={"Test"}
        slotProps={
          {
            label: { "data-testid": "label" },
            container: { "data-testid": "container" },
            indicator: { "data-testid": "indicator" }
          } as CheckboxProps["slotProps"]
        }
      />
    );

    ["label", "container", "indicator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
