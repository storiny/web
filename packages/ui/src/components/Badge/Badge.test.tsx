import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Badge, { getInsetPosition, getTranslationProps } from "./Badge";
import styles from "./Badge.module.scss";
import {
  BadgeColor,
  BadgeElevation,
  BadgeOrigin,
  BadgeProps,
  BadgeSize,
} from "./Badge.props";

describe("<Badge />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Badge />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Badge />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge as={"aside"} data-testid={"badge"} />
    );
    expect(getByTestId("badge").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with size `md`, color `inverted`, elevation `body`, inset `14%`, visible `true`, and `bottom-right` anchor origin by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge data-testid={"badge"} />
    );
    const badge = getByTestId("badge");

    expect(badge).toHaveClass(...[styles.md, styles.inverted]);
    expect(badge).toHaveStyle({
      transform: "scale(1) translateX(50%) translateY(50%)",
    });
  });

  (["xl", "lg", "md", "sm"] as BadgeSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Badge data-testid={"badge"} size={size} />
      );

      expect(getByTestId("badge")).toHaveClass(styles[size]);
    });
  });

  (["inverted", "beryl", "melon", "lemon", "ruby"] as BadgeColor[]).forEach(
    (color) => {
      it(`renders \`${color}\` color`, () => {
        const { getByTestId } = renderTestWithProvider(
          <Badge color={color} data-testid={"badge"} />
        );

        expect(getByTestId("badge")).toHaveClass(styles[color]);
      });
    }
  );

  (["body", "xs", "sm", "md", "lg"] as BadgeElevation[]).forEach(
    (elevation) => {
      it(`renders \`${elevation}\` elevation`, () => {
        const { getByTestId } = renderTestWithProvider(
          <Badge data-testid={"badge"} elevation={elevation} />
        );

        expect(getByTestId("badge")).toHaveStyle({
          "--ring-bg": `var(--bg-${
            elevation === "body" ? "body" : `elevation-${elevation}`
          })`,
        });
      });
    }
  );

  (
    [
      { horizontal: "left", vertical: "top" },
      { horizontal: "right", vertical: "top" },
      { horizontal: "right", vertical: "bottom" },
      { horizontal: "left", vertical: "bottom" },
    ] as BadgeOrigin[]
  ).forEach((anchorOrigin) => {
    it(`renders \`${anchorOrigin.vertical}-${anchorOrigin.horizontal}\` anchor origin`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Badge anchorOrigin={anchorOrigin} data-testid={"badge"} />
      );
      const { transformOriginX, transformOriginY, translateY, translateX } =
        getTranslationProps(anchorOrigin);

      expect(getByTestId("badge")).toHaveStyle({
        transform: `scale(1) ${translateX} ${translateY}`,
        transformOrigin: `${transformOriginX} ${transformOriginY}`,
      });
    });
  });

  it("renders badge content", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge badgeContent={<span data-testid={"badge-content"} />} />
    );

    expect(getByTestId("badge-content")).toBeInTheDocument();
  });

  it("renders invisible component", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge data-testid={"badge"} visible={false} />
    );

    expect(getByTestId("badge")).toHaveStyle({
      transform: "scale(0) translateX(50%) translateY(50%)",
    });
  });

  it("passes props to the container slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge
        slotProps={
          {
            container: { "data-testid": "container" },
          } as BadgeProps["slotProps"]
        }
      />
    );

    expect(getByTestId("container")).toBeInTheDocument();
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <Badge>
        <span data-testid={"child"} />
      </Badge>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  describe("getInsetPosition", () => {
    it("parses inset shorthand", () => {
      const inset = getInsetPosition("1px 2px 3px 4px");

      expect(inset).toEqual({
        top: "1px",
        right: "2px",
        bottom: "3px",
        left: "4px",
      });
    });

    it("parses single string inset value", () => {
      const inset = getInsetPosition("15%");

      expect(inset).toEqual({
        top: "15%",
        right: "15%",
        bottom: "15%",
        left: "15%",
      });
    });

    it("parses integer inset values", () => {
      const inset = getInsetPosition(15);

      expect(inset).toEqual({
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      });
    });
  });

  describe("getTranslationProps", () => {
    it("computes correct translation props", () => {
      const inset = getTranslationProps({
        vertical: "top",
        horizontal: "left",
      });

      expect(inset).toEqual({
        translateY: "translateY(-50%)",
        translateX: "translateX(-50%)",
        transformOriginY: "0%",
        transformOriginX: "0%",
      });
    });
  });
});
