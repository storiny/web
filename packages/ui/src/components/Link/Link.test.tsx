import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { levelToClassNameMap, scaleToClassNameMap } from "../common/typography";
import Link from "./Link";
import styles from "./Link.module.scss";
import {
  LinkColor,
  LinkLevel,
  LinkProps,
  LinkScale,
  LinkUnderline
} from "./Link.props";

const linkScales = Object.keys(scaleToClassNameMap) as LinkScale[];
const linkLevels = Object.keys(levelToClassNameMap) as LinkLevel[];

describe("<Link />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Link href={"/"}>Test</Link>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with `ellipsis` set to `true`", () => {
    const { container } = renderTestWithProvider(
      <Link ellipsis href={"/"}>
        Test
      </Link>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Link href={"https://storiny.com"}>Test</Link>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders with level `inherit`, color `body`, underline `hover`, and ellipsis `false` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Link data-testid={"link"} href={"/"}>
        Test
      </Link>
    );

    const link = getByTestId("link");

    expect(link).toHaveClass(
      ...[styles.inherit, styles["color-body"], styles["underline-hover"]]
    );
    expect(link).not.toHaveClass("ellipsis");
  });

  linkLevels.forEach((level) => {
    it(`renders \`${level}\` level`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Link data-testid={"link"} href={"/"} level={level}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(levelToClassNameMap[level]!);
    });
  });

  linkScales.forEach((scale) => {
    it(`renders \`${scale}\` scale`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Link data-testid={"link"} href={"/"} scale={scale}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(scaleToClassNameMap[scale]!);
    });
  });

  (["body", "beryl"] as LinkColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Link color={color} data-testid={"link"} href={"/"}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(styles[`color-${color}`]);
    });
  });

  (["always", "hover", "never"] as LinkUnderline[]).forEach((underline) => {
    it(`${underline} renders an underline`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Link data-testid={"link"} href={"/"} underline={underline}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(styles[`underline-${underline}`]);
    });
  });

  it("renders with a truncated text when using the ellipsis prop", () => {
    const { getByTestId } = renderTestWithProvider(
      <Link data-testid={"link"} ellipsis href={"/"}>
        Text
      </Link>
    );

    expect(getByTestId("link")).toHaveClass("ellipsis");
  });

  it("scale prop overrides the level prop", () => {
    const { getByTestId } = renderTestWithProvider(
      <Link data-testid={"link"} href={"/"} level={"body2"} scale={"display1"}>
        Test
      </Link>
    );

    const link = getByTestId("link");

    expect(link).toHaveClass(scaleToClassNameMap["display1"]!);
    expect(link).not.toHaveClass(levelToClassNameMap["body2"]!);
  });

  it("renders fixed color", () => {
    const { getByTestId } = renderTestWithProvider(
      <Link data-testid={"link"} fixedColor href={"/"}>
        Test
      </Link>
    );

    expect(getByTestId("link")).toHaveClass(styles["fixed-color"]);
  });

  it("adds noreferrer rel for absolute links and _blank targets", () => {
    const { getByTestId, rerender } = renderTestWithProvider(
      <Link data-testid={"link"} href={"https://storiny.com"}>
        Test
      </Link>
    );

    expect(getByTestId("link")).toHaveAttribute("rel", "noreferrer");

    rerender(
      <Link data-testid={"link"} href={"/"} target={"_blank"}>
        Test
      </Link>
    );

    expect(getByTestId("link")).toHaveAttribute("rel", "noreferrer");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Link
        ellipsis
        href={"/"}
        slotProps={
          {
            ellipsisCell: {
              "data-testid": "ellipsis-cell"
            }
          } as LinkProps["slotProps"]
        }
      >
        Test
      </Link>
    );

    expect(getByTestId("ellipsis-cell")).toBeInTheDocument();
  });
});
