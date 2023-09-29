import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import {
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP,
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
} from "../common/typography";
import Link from "./link";
import styles from "./link.module.scss";
import {
  LinkColor,
  LinkLevel,
  LinkProps,
  LinkScale,
  LinkUnderline
} from "./link.props";

const LINK_SCALES = Object.keys(
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
) as LinkScale[];
const LINK_LEVELS = Object.keys(
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP
) as LinkLevel[];

describe("<Link />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Link href={"/"}>Test</Link>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with `ellipsis` set to `true`", () => {
    const { container } = render_test_with_provider(
      <Link ellipsis href={"/"}>
        Test
      </Link>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Link href={"https://storiny.com"}>Test</Link>
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders with level `inherit`, color `body`, underline `hover`, and ellipsis `false` by default", () => {
    const { getByTestId } = render_test_with_provider(
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

  LINK_LEVELS.forEach((level) => {
    it(`renders \`${level}\` level`, () => {
      const { getByTestId } = render_test_with_provider(
        <Link data-testid={"link"} href={"/"} level={level}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(
        TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[level]!
      );
    });
  });

  LINK_SCALES.forEach((scale) => {
    it(`renders \`${scale}\` scale`, () => {
      const { getByTestId } = render_test_with_provider(
        <Link data-testid={"link"} href={"/"} scale={scale}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(
        TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP[scale]!
      );
    });
  });

  (["body", "beryl"] as LinkColor[]).forEach((color) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = render_test_with_provider(
        <Link color={color} data-testid={"link"} href={"/"}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(styles[`color-${color}`]);
    });
  });

  (["always", "hover", "never"] as LinkUnderline[]).forEach((underline) => {
    it(`${underline} renders an underline`, () => {
      const { getByTestId } = render_test_with_provider(
        <Link data-testid={"link"} href={"/"} underline={underline}>
          Test
        </Link>
      );

      expect(getByTestId("link")).toHaveClass(styles[`underline-${underline}`]);
    });
  });

  it("renders with a truncated text when using the ellipsis prop", () => {
    const { getByTestId } = render_test_with_provider(
      <Link data-testid={"link"} ellipsis href={"/"}>
        Text
      </Link>
    );

    expect(getByTestId("link")).toHaveClass("ellipsis");
  });

  it("scale prop overrides the level prop", () => {
    const { getByTestId } = render_test_with_provider(
      <Link data-testid={"link"} href={"/"} level={"body2"} scale={"display1"}>
        Test
      </Link>
    );

    const link = getByTestId("link");

    expect(link).toHaveClass(TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP["display1"]!);
    expect(link).not.toHaveClass(TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP["body2"]!);
  });

  it("renders fixed color", () => {
    const { getByTestId } = render_test_with_provider(
      <Link data-testid={"link"} fixed_color href={"/"}>
        Test
      </Link>
    );

    expect(getByTestId("link")).toHaveClass(styles["fixed-color"]);
  });

  it("adds noreferrer rel for absolute links and _blank targets", () => {
    const { getByTestId, rerender } = render_test_with_provider(
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
    const { getByTestId } = render_test_with_provider(
      <Link
        ellipsis
        href={"/"}
        slot_props={
          {
            ellipsis_cell: {
              "data-testid": "ellipsis-cell"
            }
          } as LinkProps["slot_props"]
        }
      >
        Test
      </Link>
    );

    expect(getByTestId("ellipsis-cell")).toBeInTheDocument();
  });
});
