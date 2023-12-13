import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Chip from "./chip";
import styles from "./chip.module.scss";
import { ChipProps, ChipSize, ChipType, ChipVariant } from "./chip.props";

describe("<Chip />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Chip>Test</Chip>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Chip>Test</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip as={"aside"} data-testid={"chip"}>
        Test
      </Chip>
    );

    expect(getByTestId("chip").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with role `button` on the polymorphic element when clickable", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip as={"aside"} data-testid={"chip"} type={"clickable"}>
        Test
      </Chip>
    );

    expect(getByTestId("chip")).toHaveAttribute("role", "button");
  });

  it("renders size `md`, variant `rigid`, and type `static` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip data-testid={"chip"}>Test</Chip>
    );
    const element = getByTestId("chip");

    expect(element).toHaveClass(...[styles.md, styles.rigid]);
    expect(element).not.toHaveClass(...[styles.clickable, styles.deletable]);
  });

  (["static", "clickable", "deletable"] as ChipType[]).forEach((type) => {
    it(`renders \`${type}\` type`, async () => {
      const { container, getByTestId } = render_test_with_provider(
        <Chip data-testid={"chip"} type={type}>
          Test
        </Chip>
      );

      // Test each type for accessibility violations
      expect(await axe(container)).toHaveNoViolations();

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
      const { getByTestId } = render_test_with_provider(
        <Chip data-testid={"chip"} variant={variant}>
          Test
        </Chip>
      );

      expect(getByTestId("chip")).toHaveClass(styles[variant]);
    });
  });

  (["lg", "md"] as ChipSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Chip data-testid={"chip"} size={size}>
          Test
        </Chip>
      );

      expect(getByTestId("chip")).toHaveClass(styles[size]);
    });
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip
        decorator={<span>Decorator</span>}
        slot_props={
          {
            decorator: { "data-testid": "decorator" }
          } as ChipProps["slot_props"]
        }
      >
        Test
      </Chip>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("renders action", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip
        slot_props={
          {
            action: { "data-testid": "action" }
          } as ChipProps["slot_props"]
        }
        type={"deletable"}
      >
        Test
      </Chip>
    );

    expect(getByTestId("action")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Chip
        decorator={<span>Decorator</span>}
        slot_props={
          {
            decorator: { "data-testid": "decorator" },
            action: { "data-testid": "action" }
          } as ChipProps["slot_props"]
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
