import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import RadioGroup from "../RadioGroup";
import Radio from "./Radio";
import styles from "./Radio.module.scss";
import { RadioColor, RadioProps, RadioSize } from "./Radio.props";

describe("<Radio />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <RadioGroup>
        <Radio label={"Test"} value={"test"} />
      </RadioGroup>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders size `md` and color `inverted` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup>
        <Radio data-testid={"radio"} label={"Test"} value={"test"} />
      </RadioGroup>
    );

    expect(getByTestId("radio")).toHaveClass(...[styles.md, styles.inverted]);
  });

  it("infers color and size from RadioGroup context", () => {
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup color={"ruby"} size={"lg"}>
        <Radio data-testid={"radio"} value={"test"} />
      </RadioGroup>
    );

    expect(getByTestId("radio")).toHaveClass(...[styles.ruby, styles.lg]);
  });

  (["inverted", "ruby"] as RadioColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <RadioGroup>
          <Radio color={color} data-testid={"radio"} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(styles[color]);
    });
  });

  (["lg", "md"] as RadioSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <RadioGroup>
          <Radio data-testid={"radio"} size={size} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(styles[size]);
    });
  });

  it("renders label", () => {
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup>
        <Radio
          label={"Test"}
          slotProps={
            { label: { "data-testid": "label" } } as RadioProps["slotProps"]
          }
          value={"test"}
        />
      </RadioGroup>
    );

    expect(getByTestId("label")).toHaveTextContent(/^Test$/);
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup>
        <Radio label={"Test"} value={"test"}>
          <span data-testid={"child"} />
        </Radio>
      </RadioGroup>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes the same id to input and label", () => {
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup>
        <Radio
          data-testid={"radio"}
          label={"Test"}
          slotProps={
            { label: { "data-testid": "label" } } as RadioProps["slotProps"]
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
    const { getByTestId } = renderTestWithProvider(
      <RadioGroup>
        <Radio
          label={"Test"}
          slotProps={
            {
              label: { "data-testid": "label" },
              container: { "data-testid": "container" },
              childrenContainer: { "data-testid": "children-container" }
            } as RadioProps["slotProps"]
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
