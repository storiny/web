import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Radio from "../Radio";
import radioClasses from "../Radio/Radio.module.scss";
import RadioGroup from "./RadioGroup";
import { RadioGroupProps } from "./RadioGroup.props";

describe("<RadioGroup />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <RadioGroup defaultValue={"1"}>
        {[...Array(3)].map((_, index) => (
          <Radio key={index} label={"Radio label"} value={String(index)} />
        ))}
      </RadioGroup>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <RadioGroup defaultValue={"1"}>
        <Radio label={"Radio label"} value={"1"} />
      </RadioGroup>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <RadioGroup as={"aside"} defaultValue={"1"}>
        <Radio label={"Test"} value={"1"} />
      </RadioGroup>
    );

    expect(getByRole("radiogroup").nodeName.toLowerCase()).toEqual("aside");
  });

  (["lg", "md"] as NonNullable<RadioGroupProps["size"]>[]).forEach((size) => {
    it(`passes \`${size}\` size to the context`, () => {
      const { getByTestId } = renderTestWithProvider(
        <RadioGroup size={size}>
          <Radio data-testid={"radio"} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(radioClasses[size]);
    });
  });

  (["inverted", "ruby"] as NonNullable<RadioGroupProps["color"]>[]).forEach(
    (color) => {
      it(`passes \`${color}\` color to the context`, () => {
        const { getByTestId } = renderTestWithProvider(
          <RadioGroup color={color}>
            <Radio data-testid={"radio"} value={"test"} />
          </RadioGroup>
        );

        expect(getByTestId("radio")).toHaveClass(radioClasses[color]);
      });
    }
  );
});
