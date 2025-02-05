import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Option from "../option";
import Select from "./";
import styles from "./select.module.scss";
import { SelectColor, SelectProps, SelectSize } from "./select.props";

describe("<Select />", () => {
  it("renders and matches snapshot", () => {
    const { container, getByRole } = render_test_with_provider(
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
    const { container } = render_test_with_provider(
      <Select
        slot_props={{
          trigger: {
            "aria-label": "Test"
          },
          value: {
            placeholder: "Test"
          }
        }}
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    expect(
      await axe(container, {
        rules: {
          "aria-allowed-role": {
            enabled: false
          }
        }
      })
    ).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Select
        as={"aside"}
        open
        slot_props={
          {
            content: {
              "data-testid": "content"
            }
          } as SelectProps["slot_props"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    expect(getByTestId("content").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Select
        open
        slot_props={
          {
            trigger: { "data-testid": "trigger" }
          } as SelectProps["slot_props"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );
    expect(getByTestId("trigger")).toHaveClass(...[styles.md, styles.inverted]);
  });

  it("renders trigger with custom rendering function", () => {
    const { getByTestId } = render_test_with_provider(
      <Select
        open
        render_trigger={(trigger): React.ReactNode => (
          <div data-testid={"wrapper"}>{trigger}</div>
        )}
        slot_props={
          {
            trigger: {
              "data-testid": "trigger"
            }
          } as SelectProps["slot_props"]
        }
      >
        <Option value={"test"}>Option</Option>
      </Select>
    );

    expect(getByTestId("wrapper")).toContainElement(getByTestId("trigger"));
  });

  (["lg", "md", "sm"] as SelectSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Select
          open
          size={size}
          slot_props={
            {
              trigger: { "data-testid": "trigger" }
            } as SelectProps["slot_props"]
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
      const { getByTestId } = render_test_with_provider(
        <Select
          color={color}
          open
          slot_props={
            {
              trigger: { "data-testid": "trigger" }
            } as SelectProps["slot_props"]
          }
        >
          <Option value={"test"}>Option</Option>
        </Select>
      );

      expect(getByTestId("trigger")).toHaveClass(styles[color]);
    });
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Select
        open
        slot_props={
          {
            value: { "data-testid": "value" },
            content: { "data-testid": "content" },
            trigger: { "data-testid": "trigger" },
            icon: { "data-testid": "icon" },
            viewport: { "data-testid": "viewport" }
          } as SelectProps["slot_props"]
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
