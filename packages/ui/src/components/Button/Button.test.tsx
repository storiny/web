import { axe, userEvent } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import { getByTestId } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Button from "./Button";
import styles from "./Button.module.scss";
import {
  ButtonColor,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "./Button.props";

describe("<Button />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Button>Test</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Button>Test</Button>);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByRole } = renderTestWithProvider(
      <Button as={"aside"}>Test</Button>
    );
    expect(getByRole("button").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders size `md`, variant `rigid`, color `inverted`, aria-disabled `false`, and native element as `button` by default", () => {
    const { getByRole } = renderTestWithProvider(<Button>Test</Button>);
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("button");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button).toHaveClass(
      ...[styles.md, "variant-rigid", "color-inverted"]
    );
  });

  (["inverted", "ruby"] as ButtonColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByRole } = renderTestWithProvider(
        <Button color={color}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(`color-${color}`);
    });
  });

  (["rigid", "hollow", "ghost"] as ButtonVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByRole } = renderTestWithProvider(
        <Button variant={variant}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(`variant-${variant}`);
    });
  });

  (["lg", "md", "sm", "xs"] as ButtonSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByRole } = renderTestWithProvider(
        <Button size={size}>Test</Button>
      );

      expect(getByRole("button")).toHaveClass(styles[size]);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Button
        decorator={<span>Decorator</span>}
        slotProps={
          {
            decorator: { "data-testid": "decorator" },
          } as ButtonProps["slotProps"]
        }
      >
        Test
      </Button>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Button
        decorator={<span>Decorator</span>}
        slotProps={
          {
            decorator: { "data-testid": "decorator" },
          } as ButtonProps["slotProps"]
        }
      >
        Test
      </Button>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  describe("loading state", () => {
    it("renders loading state", () => {
      const { getByRole } = renderTestWithProvider(
        <Button loading>Test</Button>
      );
      expect(getByRole("button")).toHaveClass("loading");
    });

    it("disables the button", () => {
      const { getByRole } = renderTestWithProvider(
        <Button loading>Test</Button>
      );
      expect(getByRole("button")).toBeDisabled();
    });

    it("renders a spinner", () => {
      const { getByRole } = renderTestWithProvider(
        <Button loading>Test</Button>
      );
      expect(getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("polymorphic", () => {
    it("passes the `button` role to the native non-button element", () => {
      const { getByTestId } = renderTestWithProvider(
        <Button as={"aside"} data-testid={"button"}>
          Test
        </Button>
      );

      expect(getByTestId("button")).toHaveAttribute("role", "button");
    });

    it("passes aria-disabled `true` attribute when disabled", () => {
      const { getByRole } = renderTestWithProvider(
        <Button as={"aside"} disabled>
          Test
        </Button>
      );

      expect(getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("mimics a button click on pressing the space key", async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const { getByRole } = renderTestWithProvider(
        <Button as={"aside"} onClick={onClick}>
          Test
        </Button>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire the click event on pressing the space key when disabled", async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      const { getByRole } = renderTestWithProvider(
        <Button as={"aside"} disabled onClick={onClick}>
          Test
        </Button>
      );

      getByRole("button").focus();
      await user.keyboard("[Space]");

      expect(onClick).toHaveBeenCalledTimes(0);
    });
  });

  it("renders as an anchor with correct `href` when `checkAuth` is set to `true` and the user is logged out", () => {
    const { getByRole } = renderTestWithProvider(
      <Button checkAuth>Test</Button>
    );
    const button = getByRole("button");

    expect(button.nodeName.toLowerCase()).toEqual("a");
    expect(button).toHaveAttribute("href", "/login");
  });

  it("does not fire the click event when `checkAuth` is set to `true` and the user is logged out", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { getByRole } = renderTestWithProvider(
      <Button checkAuth onClick={onClick}>
        Test
      </Button>
    );

    await user.click(getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(0);
  });
});
