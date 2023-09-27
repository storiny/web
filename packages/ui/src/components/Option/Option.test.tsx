import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Option from "../Option";
import { OptionProps } from "../Option";
import Select from "../Select";

describe("<Option />", () => {
  it("matches snapshot", () => {
    const { baseElement } = render_test_with_provider(
      <Select open>
        <Option value={"test"}>Test</Option>
      </Select>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Select open>
        <Option as={"aside"} value={"test"}>
          Test
        </Option>
      </Select>
    );

    expect(getByRole("option").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders right slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Select open>
        <Option rightSlot={<span data-testid={"right-slot"} />} value={"test"}>
          Test
        </Option>
      </Select>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Select open>
        <Option
          decorator={"Test"}
          slot_props={
            {
              decorator: { "data-testid": "decorator" }
            } as OptionProps["slot_props"]
          }
          value={"test"}
        >
          Test
        </Option>
      </Select>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Select defaultValue={"test"} open>
        <Option
          decorator={"Test"}
          rightSlot={"test"}
          slot_props={
            {
              text: { "data-testid": "text" },
              indicator: { "data-testid": "indicator" },
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" }
            } as OptionProps["slot_props"]
          }
          value={"test"}
        >
          Test
        </Option>
      </Select>
    );

    ["text", "indicator", "decorator", "right-slot"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
