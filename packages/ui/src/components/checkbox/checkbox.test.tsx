import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Checkbox from "./checkbox";
import styles from "./checkbox.module.scss";
import { CheckboxColor, CheckboxProps, CheckboxSize } from "./checkbox.props";

describe("<Checkbox />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Checkbox label={"Test"} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Checkbox label={"Test"} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Checkbox data-testid={"checkbox"} label={"Test"} />
    );
    expect(getByTestId("checkbox")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["inverted", "ruby"] as CheckboxColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = render_test_with_provider(
        <Checkbox color={color} data-testid={"checkbox"} />
      );

      expect(getByTestId("checkbox")).toHaveClass(styles[color]);
    });
  });

  (["lg", "md"] as CheckboxSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Checkbox data-testid={"checkbox"} size={size} />
      );

      expect(getByTestId("checkbox")).toHaveClass(styles[size]);
    });
  });

  it("renders label", () => {
    const { getByTestId } = render_test_with_provider(
      <Checkbox
        label={"Test"}
        slot_props={
          { label: { "data-testid": "label" } } as CheckboxProps["slot_props"]
        }
      />
    );

    expect(getByTestId("label")).toHaveTextContent(/^Test$/);
  });

  it("passes the same id to input and label", () => {
    const { getByTestId } = render_test_with_provider(
      <Checkbox
        data-testid={"checkbox"}
        label={"Test"}
        slot_props={
          { label: { "data-testid": "label" } } as CheckboxProps["slot_props"]
        }
      />
    );

    expect(getByTestId("checkbox")).toHaveAttribute(
      "id",
      getByTestId("label").getAttribute("for")
    );
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Checkbox
        checked
        label={"Test"}
        slot_props={
          {
            label: { "data-testid": "label" },
            container: { "data-testid": "container" },
            indicator: { "data-testid": "indicator" }
          } as CheckboxProps["slot_props"]
        }
      />
    );

    ["label", "container", "indicator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
