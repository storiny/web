import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";
import { render_test_with_provider } from "src/redux/test-utils";

import Badge, { get_inset_position, get_translation_props } from "./badge";
import styles from "./badge.module.scss";
import {
  BadgeColor,
  BadgeElevation,
  BadgeOrigin,
  BadgeProps,
  BadgeSize
} from "./badge.props";

describe("<Badge />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Badge />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Badge />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge as={"aside"} data-testid={"badge"} />
    );
    expect(getByTestId("badge").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md`, color `inverted`, elevation `body`, inset `14%`, visible `true`, and `bottom-right` anchor origin by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge data-testid={"badge"} />
    );
    const badge = getByTestId("badge");

    expect(badge).toHaveClass(...[styles.md, styles.inverted]);
    expect(badge).toHaveStyle({
      transform: "scale(1) translateX(50%) translateY(50%)"
    });
  });

  (["xl", "lg", "md", "sm"] as BadgeSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Badge data-testid={"badge"} size={size} />
      );

      expect(getByTestId("badge")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "beryl", "melon", "lemon", "ruby"] as BadgeColor[]).forEach(
    (color) => {
      it(`renders \`${color}\` color`, () => {
        const { getByTestId } = render_test_with_provider(
          <Badge color={color} data-testid={"badge"} />
        );

        expect(getByTestId("badge")).toHaveClass(styles[color]);
      });
    }
  );

  (["body", "xs", "sm", "md", "lg"] as BadgeElevation[]).forEach(
    (elevation) => {
      it(`renders \`${elevation}\` elevation`, () => {
        const { getByTestId } = render_test_with_provider(
          <Badge data-testid={"badge"} elevation={elevation} />
        );

        expect(getByTestId("badge")).toHaveStyle({
          "--ring-bg": `var(--bg-${
            elevation === "body" ? "body" : `elevation-${elevation}`
          })`
        });
      });
    }
  );

  (
    [
      { horizontal: "left", vertical: "top" },
      { horizontal: "right", vertical: "top" },
      { horizontal: "right", vertical: "bottom" },
      { horizontal: "left", vertical: "bottom" }
    ] as BadgeOrigin[]
  ).forEach((anchor_origin) => {
    it(`renders \`${anchor_origin.vertical}-${anchor_origin.horizontal}\` anchor origin`, () => {
      const { getByTestId } = render_test_with_provider(
        <Badge anchor_origin={anchor_origin} data-testid={"badge"} />
      );
      const {
        transform_origin_y,
        transform_origin_x,
        translate_y,
        translate_x
      } = get_translation_props(anchor_origin);

      expect(getByTestId("badge")).toHaveStyle({
        transform: `scale(1) ${translate_x} ${translate_y}`,
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        transformOrigin: `${transform_origin_x} ${transform_origin_y}`
      });
    });
  });

  it("renders badge content", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge badge_content={<span data-testid={"badge-content"} />} />
    );

    expect(getByTestId("badge-content")).toBeInTheDocument();
  });

  it("renders invisible component", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge data-testid={"badge"} visible={false} />
    );

    expect(getByTestId("badge")).toHaveStyle({
      transform: "scale(0) translateX(50%) translateY(50%)"
    });
  });

  it("passes props to the container slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge
        slot_props={
          {
            container: { "data-testid": "container" }
          } as BadgeProps["slot_props"]
        }
      />
    );

    expect(getByTestId("container")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <Badge>
        <span data-testid={"child"} />
      </Badge>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  describe("get_inset_position", () => {
    it("parses inset shorthand", () => {
      const inset = get_inset_position("1px 2px 3px 4px");

      expect(inset).toEqual({
        top: "1px",
        right: "2px",
        bottom: "3px",
        left: "4px"
      });
    });

    it("parses single string inset value", () => {
      const inset = get_inset_position("15%");

      expect(inset).toEqual({
        top: "15%",
        right: "15%",
        bottom: "15%",
        left: "15%"
      });
    });

    it("parses integer inset values", () => {
      const inset = get_inset_position(15);

      expect(inset).toEqual({
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      });
    });
  });

  describe("get_translation_props", () => {
    it("computes correct translation props", () => {
      const inset = get_translation_props({
        vertical: "top",
        horizontal: "left"
      });

      expect(inset).toEqual({
        translate_y: "translateY(-50%)",
        translate_x: "translateX(-50%)",
        transform_origin_y: "0%",
        transform_origin_x: "0%"
      });
    });
  });
});
