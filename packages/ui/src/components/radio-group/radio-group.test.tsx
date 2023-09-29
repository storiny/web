import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Radio from "../radio";
import radio_classes from "../radio/radio.module.scss";
import RadioGroup from "./radio-group";
import { RadioGroupProps } from "./radio-group.props";

describe("<RadioGroup />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <RadioGroup defaultValue={"1"}>
        {[...Array(3)].map((_, index) => (
          <Radio key={index} label={"Radio label"} value={String(index)} />
        ))}
      </RadioGroup>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <RadioGroup defaultValue={"1"}>
        <Radio label={"Radio label"} value={"1"} />
      </RadioGroup>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <RadioGroup as={"aside"} defaultValue={"1"}>
        <Radio label={"Test"} value={"1"} />
      </RadioGroup>
    );

    expect(getByRole("radiogroup").nodeName.toLowerCase()).toEqual("aside");
  });

  (["lg", "md"] as NonNullable<RadioGroupProps["size"]>[]).forEach((size) => {
    it(`passes \`${size}\` size to the context`, () => {
      const { getByTestId } = render_test_with_provider(
        <RadioGroup size={size}>
          <Radio data-testid={"radio"} value={"test"} />
        </RadioGroup>
      );

      expect(getByTestId("radio")).toHaveClass(radio_classes[size]);
    });
  });

  (["inverted", "ruby"] as NonNullable<RadioGroupProps["color"]>[]).forEach(
    (color) => {
      it(`passes \`${color}\` color to the context`, () => {
        const { getByTestId } = render_test_with_provider(
          <RadioGroup color={color}>
            <Radio data-testid={"radio"} value={"test"} />
          </RadioGroup>
        );

        expect(getByTestId("radio")).toHaveClass(radio_classes[color]);
      });
    }
  );
});
