import { axe, user_event } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";
import css from "~/theme/main.module.scss";

import Button from "./button";
import styles from "./button.module.scss";
import {
  ButtonColor,
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from "./button.props";

describe("<Button />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Button>Test</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Button>Test</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <Button as={"aside"}>Test</Button>
    );
    expect(getByRole("button").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md`, variant `rigid`, color `inverted`, aria-disabled `false`, and native element as `button` by default", () => {
    const { getByRole } = render_test_with_provider(<Button>Test</Button>);
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("button");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button).toHaveClass(
      ...[styles.md, "variant-rigid", "color-inverted"]
    );
  });

  (["inverted", "ruby"] as ButtonColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = render_test_with_provider(
        <Button color={color}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(`color-${color}`);
    });
  });

  (["rigid", "hollow", "ghost"] as ButtonVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByRole } = render_test_with_provider(
        <Button variant={variant}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(`variant-${variant}`);
    });
  });

  (["lg", "md", "sm", "xs"] as ButtonSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <Button size={size}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(styles[size]);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Button
        decorator={<span>Decorator</span>}
        slot_props={
          {
            decorator: { "data-testid": "decorator" }
          } as ButtonProps["slot_props"]
        }
      >
        Test
      </Button>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Button
        decorator={<span>Decorator</span>}
        slot_props={
          {
            decorator: { "data-testid": "decorator" }
          } as ButtonProps["slot_props"]
        }
      >
        Test
      </Button>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  describe("loading state", () => {
    it("renders loading state", () => {
      const { getByRole } = render_test_with_provider(
        <Button loading>Test</Button>
      );
      expect(getByRole("button")).toHaveClass("loading");
    });

    it("disables the button", () => {
      const { getByRole } = render_test_with_provider(
        <Button loading>Test</Button>
      );
      expect(getByRole("button")).toBeDisabled();
    });

    it("renders a spinner", () => {
      const { getByRole } = render_test_with_provider(
        <Button loading>Test</Button>
      );
      expect(getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("polymorphic", () => {
    it("passes the `button` role to the native non-button element", () => {
      const { getByTestId } = render_test_with_provider(
        <Button as={"aside"} data-testid={"button"}>
          Test
        </Button>
      );

      expect(getByTestId("button")).toHaveAttribute("role", "button");
    });

    it("passes aria-disabled `true` attribute when disabled", () => {
      const { getByRole } = render_test_with_provider(
        <Button as={"aside"} disabled>
          Test
        </Button>
      );

      expect(getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("mimics a button click on pressing the space key", async () => {
      const user = user_event.setup();
      const on_click = jest.fn();
      const { getByRole } = render_test_with_provider(
        <Button as={"aside"} onClick={on_click}>
          Test
        </Button>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(on_click).toHaveBeenCalledTimes(1);
    });

    it("does not fire the click event on pressing the space key when disabled", async () => {
      const user = user_event.setup();
      const on_click = jest.fn();
      const { getByRole } = render_test_with_provider(
        <Button as={"aside"} disabled onClick={on_click}>
          Test
        </Button>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(on_click).toHaveBeenCalledTimes(0);
    });
  });

  it("renders as an anchor with correct `href` when `check_auth` is set to `true` and the user is logged out", () => {
    const { getByRole } = render_test_with_provider(
      <Button check_auth>Test</Button>
    );
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("a");
    expect(button).toHaveAttribute("href", "/login");
  });

  it("does not fire the click event when `check_auth` is set to `true` and the user is logged out", async () => {
    const user = user_event.setup();
    const on_click = jest.fn();
    const { getByRole } = render_test_with_provider(
      <Button check_auth onClick={on_click}>
        Test
      </Button>
    );

    await user.click(getByRole("button"));
    expect(on_click).toHaveBeenCalledTimes(0);
  });
});
