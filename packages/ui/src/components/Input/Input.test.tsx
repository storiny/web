import { axe, userEvent } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Input from "./Input";
import styles from "./Input.module.scss";
import { InputColor, InputProps, InputSize } from "./Input.props";

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

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
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
        endDecorator={<span>End decorator</span>}
        slot_props={
          {
            endDecorator: { "data-testid": "end-decorator" }
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
        endDecorator={<span />}
        slot_props={
          {
            container: { "data-testid": "container" },
            decorator: { "data-testid": "decorator" },
            endDecorator: { "data-testid": "end-decorator" }
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
              spinnerContainer: { "data-testid": "spinner-container" }
            } as InputProps["slot_props"]
          }
          type={"number"}
        />
      );

      // Test for accessibility violations
      await waitFor(async () =>
        expect(await axe(container)).toHaveNoViolations()
      );
      expect(getByTestId("spinner-container")).toBeInTheDocument();
      expect(container.firstChild).toMatchSnapshot();
    });

    it("passes props to the spinner slots", () => {
      const { getByTestId } = render_test_with_provider(
        <Input
          slot_props={
            {
              spinnerContainer: { "data-testid": "spinner-container" },
              spinnerSeparator: { "data-testid": "spinner-separator" },
              spinnerDecrementButton: {
                "data-testid": "spinner-decrement-button"
              },
              spinnerIncrementButton: {
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
      const user = userEvent.setup();
      const { getByTestId } = render_test_with_provider(
        <Input
          data-testid={"input"}
          defaultValue={0}
          slot_props={
            {
              spinnerIncrementButton: {
                "data-testid": "spinner-increment-button"
              },
              spinnerDecrementButton: {
                "data-testid": "spinner-decrement-button"
              }
            } as InputProps["slot_props"]
          }
          step={1}
          type={"number"}
        />
      );

      const input = getByTestId("input");
      const decrementButton = getByTestId("spinner-decrement-button");
      const incrementButton = getByTestId("spinner-increment-button");

      expect(input).toHaveValue(0);
      await user.click(incrementButton);
      expect(input).toHaveValue(1);
      await user.click(decrementButton);
      expect(input).toHaveValue(0);
    });

    it("replaces end decorator with spinner", () => {
      const { queryByTestId } = render_test_with_provider(
        <Input
          endDecorator={<span />}
          slot_props={
            {
              endDecorator: { "data-testid": "end-decorator" }
            } as InputProps["slot_props"]
          }
          type={"number"}
        />
      );

      expect(queryByTestId("end-decorator")).not.toBeInTheDocument();
    });
  });
});
