import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Option from "../Option";
import { OptionProps } from "../Option";
import Select from "../Select";

describe("<Option />", () => {
  it("matches snapshot", () => {
    const { baseElement } = renderTestWithProvider(
      <Select open>
        <Option value={"test"}>Test</Option>
      </Select>
    );

    expect(baseElement).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Select open>
        <Option as={"aside"} value={"test"}>
          Test
        </Option>
      </Select>
    );

    expect(getByRole("option").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders right slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select open>
        <Option rightSlot={<span data-testid={"right-slot"} />} value={"test"}>
          Test
        </Option>
      </Select>
    );

    expect(getByTestId("right-slot")).toBeInTheDocument();
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select open>
        <Option
          decorator={"Test"}
          slotProps={
            {
              decorator: { "data-testid": "decorator" }
            } as OptionProps["slotProps"]
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
    const { getByTestId } = renderTestWithProvider(
      <Select defaultValue={"test"} open>
        <Option
          decorator={"Test"}
          rightSlot={"test"}
          slotProps={
            {
              text: { "data-testid": "text" },
              indicator: { "data-testid": "indicator" },
              decorator: { "data-testid": "decorator" },
              rightSlot: { "data-testid": "right-slot" }
            } as OptionProps["slotProps"]
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
