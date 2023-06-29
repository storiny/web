import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Chip from "./Chip";
import styles from "./Chip.module.scss";
import { ChipProps, ChipSize, ChipType, ChipVariant } from "./Chip.props";

describe("<Chip />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Chip>Test</Chip>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Chip>Test</Chip>);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip as={"aside"} data-testid={"chip"}>
        Test
      </Chip>
    );

    expect(getByTestId("chip").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with role `button` on the polymorphic element when clickable", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip as={"aside"} data-testid={"chip"} type={"clickable"}>
        Test
      </Chip>
    );

    expect(getByTestId("chip")).toHaveAttribute("role", "button");
  });

  it("renders size `md`, variant `rigid`, and type `static` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip data-testid={"chip"}>Test</Chip>
    );
    const element = getByTestId("chip");

    expect(element).toHaveClass(...[styles.md, styles.rigid]);
    expect(element).not.toHaveClass(...[styles.clickable, styles.deletable]);
  });

  (["static", "clickable", "deletable"] as ChipType[]).forEach((type) => {
    it(`renders \`${type}\` type`, async () => {
      const { container, getByTestId } = renderTestWithProvider(
        <Chip data-testid={"chip"} type={type}>
          Test
        </Chip>
      );

      // Test each type for accessibility violations
      await waitFor(async () =>
        expect(await axe(container)).toHaveNoViolations()
      );

      if (type === "static") {
        expect(getByTestId("chip")).not.toHaveClass(
          ...[styles.clickable, styles.deletable]
        );
      } else {
        expect(getByTestId("chip")).toHaveClass(styles[type]);
      }
    });
  });

  (["rigid", "soft"] as ChipVariant[]).forEach((variant) => {
    it(`renders \`${variant}\` variant`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Chip data-testid={"chip"} variant={variant}>
          Test
        </Chip>
      );

      expect(getByTestId("chip")).toHaveClass(styles[variant]);
    });
  });

  (["lg", "md"] as ChipSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Chip data-testid={"chip"} size={size}>
          Test
        </Chip>
      );

      expect(getByTestId("chip")).toHaveClass(styles[size]);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip
        decorator={<span>Decorator</span>}
        slotProps={
          {
            decorator: { "data-testid": "decorator" },
          } as ChipProps["slotProps"]
        }
      >
        Test
      </Chip>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders action", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip
        slotProps={
          {
            action: { "data-testid": "action" },
          } as ChipProps["slotProps"]
        }
        type={"deletable"}
      >
        Test
      </Chip>
    );

    expect(getByTestId("action")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Chip
        decorator={<span>Decorator</span>}
        slotProps={
          {
            decorator: { "data-testid": "decorator" },
            action: { "data-testid": "action" },
          } as ChipProps["slotProps"]
        }
        type={"deletable"}
      >
        Test
      </Chip>
    );

    ["decorator", "action"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
