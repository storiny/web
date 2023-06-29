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

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select defaultValue={"test"} open>
        <Option
          slotProps={
            {
              text: { "data-testid": "text" },
              indicator: { "data-testid": "indicator" },
            } as OptionProps["slotProps"]
          }
          value={"test"}
        >
          Test
        </Option>
      </Select>
    );

    ["text", "indicator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
