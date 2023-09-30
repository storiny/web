import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import RadioGroup from "../radio-group";
import Radio from "./radio";
import styles from "./radio.module.scss";
import { RadioColor, RadioProps, RadioSize } from "./radio.props";

describe("<Radio />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <RadioGroup>
        <Radio label={"Test"} value={"test"} />
      </RadioGroup>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup>
        <Radio data-testid={"radio"} label={"Test"} value={"test"} />
      </RadioGroup>
    );

    expect(getByTestId("radio")).toHaveClass(...[styles.md, styles.inverted]);
  });

  it("infers color and size from RadioGroup context", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup color={"ruby"} size={"lg"}>
        <Radio data-testid={"radio"} value={"test"} />
      </RadioGroup>
    );

    expect(getByTestId("radio")).toHaveClass(...[styles.ruby, styles.lg]);
  });

  (["inverted", "ruby"] as RadioColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = render_test_with_provider(
        <RadioGroup>
          <Radio color={color} data-testid={"radio"} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(styles[color]);
    });
  });

  (["lg", "md"] as RadioSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <RadioGroup>
          <Radio data-testid={"radio"} size={size} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(styles[size]);
    });
  });

  it("renders label", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup>
        <Radio
          label={"Test"}
          slot_props={
            { label: { "data-testid": "label" } } as RadioProps["slot_props"]
          }
          value={"test"}
        />
      </RadioGroup>
    );

    expect(getByTestId("label")).toHaveTextContent(/^Test$/);
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup>
        <Radio label={"Test"} value={"test"}>
          <span data-testid={"child"} />
        </Radio>
      </RadioGroup>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes the same id to input and label", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup>
        <Radio
          data-testid={"radio"}
          label={"Test"}
          slot_props={
            { label: { "data-testid": "label" } } as RadioProps["slot_props"]
          }
          value={"test"}
        />
      </RadioGroup>
    );

    expect(getByTestId("radio")).toHaveAttribute(
      "id",
      getByTestId("label").getAttribute("for")
    );
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <RadioGroup>
        <Radio
          label={"Test"}
          slot_props={
            {
              label: { "data-testid": "label" },
              container: { "data-testid": "container" },
              children_container: { "data-testid": "children-container" }
            } as RadioProps["slot_props"]
          }
          value={"test"}
        />
      </RadioGroup>
    );

    ["label", "container", "children-container"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
