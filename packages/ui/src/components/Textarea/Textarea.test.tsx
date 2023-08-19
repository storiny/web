import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Textarea from "./Textarea";
import styles from "./Textarea.module.scss";
import { TextareaColor, TextareaProps, TextareaSize } from "./Textarea.props";

describe("<Textarea />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <Textarea placeholder={"Test"} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Textarea placeholder={"Test"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Textarea
        slotProps={
          {
            container: { as: "aside", "data-testid": "container" }
          } as TextareaProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders end decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Textarea endDecorator={<span data-testid={"end-decorator"} />} />
    );

    expect(getByTestId("end-decorator")).toBeInTheDocument();
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Textarea
        slotProps={
          {
            container: { "data-testid": "container" }
          } as TextareaProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["inverted", "ruby"] as TextareaColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Textarea
          color={color}
          slotProps={
            {
              container: { "data-testid": "container" }
            } as TextareaProps["slotProps"]
          }
        />
      );

      expect(getByTestId("container")).toHaveClass(styles[color]);
    });
  });

  (["md", "sm"] as TextareaSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Textarea
          size={size}
          slotProps={
            {
              container: { "data-testid": "container" }
            } as TextareaProps["slotProps"]
          }
        />
      );

      expect(getByTestId("container")).toHaveClass(styles[size]);
    });
  });

  it("passes props to the container slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Textarea
        slotProps={
          {
            container: { "data-testid": "container" }
          } as TextareaProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).toBeInTheDocument();
  });
});
