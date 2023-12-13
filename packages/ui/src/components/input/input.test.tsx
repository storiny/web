import { axe, user_event as user_event } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Input from "./input";
import styles from "./input.module.scss";
import { InputColor, InputProps, InputSize } from "./input.props";

describe("<Input />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Input placeholder={"Test"} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Input placeholder={"Test"} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Input
        slot_props={
          {
            container: { as: "aside", "data-testid": "container" }
          } as InputProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md` and color `inverted` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Input
        slot_props={
          {
            container: { "data-testid": "container" }
          } as InputProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container")).toHaveClass(
      ...[styles.md, styles.inverted]
    );
  });

  (["inverted", "ruby"] as InputColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = render_test_with_provider(
        <Input
          color={color}
          slot_props={
            {
              container: { "data-testid": "container" }
            } as InputProps["slot_props"]
          }
        />
      );

      expect(getByTestId("container")).toHaveClass(styles[color]);
    });
  });

  (["lg", "md", "sm"] as InputSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Input
          size={size}
          slot_props={
            {
              container: { "data-testid": "container" }
            } as InputProps["slot_props"]
          }
        />
      );

      expect(getByTestId("container")).toHaveClass(styles[size]);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Input
        decorator={<span>Decorator</span>}
        slot_props={
          {
            decorator: { "data-testid": "decorator" }
          } as InputProps["slot_props"]
        }
      />
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders end decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Input
        end_decorator={<span>End decorator</span>}
        slot_props={
          {
            end_decorator: { "data-testid": "end-decorator" }
          } as InputProps["slot_props"]
        }
      />
    );

    expect(getByTestId("end-decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Input
        data-testid={"input"}
        decorator={<span />}
        end_decorator={<span />}
        slot_props={
          {
            container: { "data-testid": "container" },
            decorator: { "data-testid": "decorator" },
            end_decorator: { "data-testid": "end-decorator" }
          } as InputProps["slot_props"]
        }
      />
    );

    ["input", "container", "decorator", "end-decorator"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });

  describe("spinner", () => {
    it("renders spinner and matches snapshot", async () => {
      const { getByTestId, container } = render_test_with_provider(
        <Input
          placeholder={"Test"}
          slot_props={
            {
              spinner_container: { "data-testid": "spinner-container" }
            } as InputProps["slot_props"]
          }
          type={"number"}
        />
      );

      // Test for accessibility violations
      expect(await axe(container)).toHaveNoViolations();
      expect(getByTestId("spinner-container")).toBeInTheDocument();
      expect(container.firstChild).toMatchSnapshot();
    });

    it("passes props to the spinner slots", () => {
      const { getByTestId } = render_test_with_provider(
        <Input
          slot_props={
            {
              spinner_container: { "data-testid": "spinner-container" },
              spinner_separator: { "data-testid": "spinner-separator" },
              spinner_decrement_button: {
                "data-testid": "spinner-decrement-button"
              },
              spinner_increment_button: {
                "data-testid": "spinner-increment-button"
              }
            } as InputProps["slot_props"]
          }
          type={"number"}
        />
      );

      [
        "spinner-container",
        "spinner-separator",
        "spinner-decrement-button",
        "spinner-increment-button"
      ].forEach((element) => {
        expect(getByTestId(element)).toBeInTheDocument();
      });
    });

    it("increments and decrements value", async () => {
      const user = user_event.setup();
      const { getByTestId } = render_test_with_provider(
        <Input
          data-testid={"input"}
          defaultValue={0}
          slot_props={
            {
              spinner_increment_button: {
                "data-testid": "spinner-increment-button"
              },
              spinner_decrement_button: {
                "data-testid": "spinner-decrement-button"
              }
            } as InputProps["slot_props"]
          }
          step={1}
          type={"number"}
        />
      );

      const input = getByTestId("input");
      const decrement_button = getByTestId("spinner-decrement-button");
      const increment_button = getByTestId("spinner-increment-button");

      expect(input).toHaveValue(0);
      await user.click(increment_button);
      expect(input).toHaveValue(1);
      await user.click(decrement_button);
      expect(input).toHaveValue(0);
    });

    it("replaces end decorator with spinner", () => {
      const { queryByTestId } = render_test_with_provider(
        <Input
          end_decorator={<span />}
          slot_props={
            {
              end_decorator: { "data-testid": "end-decorator" }
            } as InputProps["slot_props"]
          }
          type={"number"}
        />
      );

      expect(queryByTestId("end-decorator")).not.toBeInTheDocument();
    });
  });
});
