import { axe, user_event } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";
import css from "~/theme/main.module.scss";

import IconButton from "./icon-button";
import styles from "./icon-button.module.scss";
import {
  IconButtonColor,
  IconButtonSize,
  IconButtonVariant
} from "./icon-button.props";

describe("<IconButton />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <IconButton>Test</IconButton>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <IconButton>Test</IconButton>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = render_test_with_provider(
      <IconButton as={"aside"}>Test</IconButton>
    );
    expect(getByRole("button").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md`, variant `rigid`, color `inverted`, aria-disabled `false`, and native element as `button` by default", () => {
    const { getByRole } = render_test_with_provider(
      <IconButton>Test</IconButton>
    );
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("button");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button).toHaveClass(
      ...[styles.md, "variant-rigid", "color-inverted"]
    );
  });

  (["inverted", "ruby"] as IconButtonColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = render_test_with_provider(
        <IconButton color={color}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(`color-${color}`);
    });
  });

  (["rigid", "hollow", "ghost"] as IconButtonVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByRole } = render_test_with_provider(
        <IconButton variant={variant}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(`variant-${variant}`);
    });
  });

  (["lg", "md", "sm", "xs"] as IconButtonSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = render_test_with_provider(
        <IconButton size={size}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(styles[size]);
    });
  });

  describe("loading state", () => {
    it("renders loading state", () => {
      const { getByRole } = render_test_with_provider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("button")).toHaveClass("loading");
    });

    it("disables the button", () => {
      const { getByRole } = render_test_with_provider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("button")).toBeDisabled();
    });

    it("renders a spinner", () => {
      const { getByRole } = render_test_with_provider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("polymorphic", () => {
    it("passes the `button` role to the native non-button element", () => {
      const { getByTestId } = render_test_with_provider(
        <IconButton as={"aside"} data-testid={"button"}>
          Test
        </IconButton>
      );

      expect(getByTestId("button")).toHaveAttribute("role", "button");
    });

    it("passes aria-disabled `true` attribute when disabled", () => {
      const { getByRole } = render_test_with_provider(
        <IconButton as={"aside"} disabled>
          Test
        </IconButton>
      );

      expect(getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("mimics a button click on pressing the space key", async () => {
      const user = user_event.setup();
      const on_click = jest.fn();
      const { getByRole } = render_test_with_provider(
        <IconButton as={"aside"} onClick={on_click}>
          Test
        </IconButton>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(on_click).toHaveBeenCalledTimes(1);
    });

    it("does not fire the click event on pressing the space key when disabled", async () => {
      const user = user_event.setup();
      const on_click = jest.fn();
      const { getByRole } = render_test_with_provider(
        <IconButton as={"aside"} disabled onClick={on_click}>
          Test
        </IconButton>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(on_click).toHaveBeenCalledTimes(0);
    });
  });

  it("renders as an anchor with correct `href` when `check_auth` is set to `true` and the user is logged out", () => {
    const { getByRole } = render_test_with_provider(
      <IconButton check_auth>Test</IconButton>
    );
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("a");
    expect(button).toHaveAttribute("href", "/login");
  });

  it("does not fire the click event when `check_auth` is set to `true` and the user is logged out", async () => {
    const user = user_event.setup();
    const on_click = jest.fn();
    const { getByRole } = render_test_with_provider(
      <IconButton check_auth onClick={on_click}>
        Test
      </IconButton>
    );

    await user.click(getByRole("button"));
    expect(on_click).toHaveBeenCalledTimes(0);
  });
});
