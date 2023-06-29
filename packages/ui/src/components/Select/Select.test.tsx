import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Option from "../Option";
import Select from "../Select";
import styles from "./Select.module.scss";
import { SelectColor, SelectProps, SelectSize } from "./Select.props";

describe("<Select />", () => {
  it("renders and matches snapshot", () => {
    const { container, getByRole } = renderTestWithProvider(
      <Select open>
        {[...Array(3)].map((_, index) => (
          <Option key={index} value={`${index}`}>
            Option
          </Option>
        ))}
      </Select>
    );

    expect(getByRole("listbox")).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Select
        slotProps={{
          trigger: {
            "aria-label": "Test",
          },
          value: {
            placeholder: "Test",
          },
        }}
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    await waitFor(async () =>
      expect(
        await axe(container, {
          rules: {
            "aria-allowed-role": {
              enabled: false,
            },
          },
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select
        as={"aside"}
        open
        slotProps={
          {
            content: {
              "data-testid": "content",
            },
          } as SelectProps["slotProps"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select
        open
        slotProps={
          {
            trigger: { "data-testid": "trigger" },
          } as SelectProps["slotProps"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );
    expect(getByTestId("trigger")).toHaveClass(...[styles.md, styles.inverted]);
  });

  it("renders trigger with custom rendering function", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select
        open
        renderTrigger={(trigger): React.ReactNode => (
          <div data-testid={"wrapper"}>{trigger}</div>
        )}
        slotProps={
          {
            trigger: {
              "data-testid": "trigger",
            },
          } as SelectProps["slotProps"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    expect(getByTestId("wrapper")).toContainElement(getByTestId("trigger"));
  });

  (["lg", "md", "sm"] as SelectSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Select
          open
          size={size}
          slotProps={
            {
              trigger: { "data-testid": "trigger" },
            } as SelectProps["slotProps"]
          }
        >
          <Option value={"test"}>Option</Option>
        </Select>
      );

      expect(getByTestId("trigger")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "ruby"] as SelectColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Select
          color={color}
          open
          slotProps={
            {
              trigger: { "data-testid": "trigger" },
            } as SelectProps["slotProps"]
          }
        >
          <Option value={"test"}>Option</Option>
        </Select>
      );

      expect(getByTestId("trigger")).toHaveClass(styles[color]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Select
        open
        slotProps={
          {
            value: { "data-testid": "value" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" },
            icon: { "data-testid": "icon" },
            viewport: { "data-testid": "viewport" },
          } as SelectProps["slotProps"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    ["value", "content", "trigger", "icon", "viewport"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
