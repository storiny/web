import { axe, userEvent } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import IconButton from "./IconButton";
import styles from "./IconButton.module.scss";
import {
  IconButtonColor,
  IconButtonSize,
  IconButtonVariant,
} from "./IconButton.props";

describe("<IconButton />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<IconButton>Test</IconButton>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<IconButton>Test</IconButton>);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <IconButton as={"aside"}>Test</IconButton>
    );
    expect(getByRole("button").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md`, variant `rigid`, color `inverted`, aria-disabled `false`, and native element as `button` by default", () => {
    const { getByRole } = renderTestWithProvider(<IconButton>Test</IconButton>);
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("button");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button).toHaveClass(
      ...[styles.md, "variant-rigid", "color-inverted"]
    );
  });

  (["inverted", "ruby"] as IconButtonColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton color={color}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(`color-${color}`);
    });
  });

  (["rigid", "hollow", "ghost"] as IconButtonVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton variant={variant}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(`variant-${variant}`);
    });
  });

  (["lg", "md", "sm", "xs"] as IconButtonSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton size={size}>Test</IconButton>
      );

      expect(getByRole("button")).toHaveClass(styles[size]);
    });
  });

  describe("loading state", () => {
    it("renders loading state", () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("button")).toHaveClass("loading");
    });

    it("disables the button", () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("button")).toBeDisabled();
    });

    it("renders a spinner", () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton loading>Test</IconButton>
      );
      expect(getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("polymorphic", () => {
    it("passes the `button` role to the native non-button element", () => {
      const { getByTestId } = renderTestWithProvider(
        <IconButton as={"aside"} data-testid={"button"}>
          Test
        </IconButton>
      );

      expect(getByTestId("button")).toHaveAttribute("role", "button");
    });

    it("passes aria-disabled `true` attribute when disabled", () => {
      const { getByRole } = renderTestWithProvider(
        <IconButton as={"aside"} disabled>
          Test
        </IconButton>
      );

      expect(getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("mimics a button click on pressing the space key", async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const { getByRole } = renderTestWithProvider(
        <IconButton as={"aside"} onClick={onClick}>
          Test
        </IconButton>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire the click event on pressing the space key when disabled", async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const { getByRole } = renderTestWithProvider(
        <IconButton as={"aside"} disabled onClick={onClick}>
          Test
        </IconButton>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(onClick).toHaveBeenCalledTimes(0);
    });
  });

  it("renders as an anchor with correct `href` when `checkAuth` is set to `true` and the user is logged out", () => {
    const { getByRole } = renderTestWithProvider(
      <IconButton checkAuth>Test</IconButton>
    );
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("a");
    expect(button).toHaveAttribute("href", "/login");
  });

  it("does not fire the click event when `checkAuth` is set to `true` and the user is logged out", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { getByRole } = renderTestWithProvider(
      <IconButton checkAuth onClick={onClick}>
        Test
      </IconButton>
    );

    await user.click(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});
