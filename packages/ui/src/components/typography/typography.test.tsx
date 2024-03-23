import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import {
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP,
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
} from "../common/typography";
import Typography from "./typography";
import {
  TypographyColor,
  TypographyElement,
  TypographyLevel,
  TypographyProps,
  TypographyScale,
  TypographyWeight
} from "./typography.props";

const TYPOGRAPHY_SCALES = Object.keys(
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
) as TypographyScale[];
const TYPOGRAPHY_LEVELS = Object.keys(
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP
) as TypographyLevel[];

describe("<Typography />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Typography>Test</Typography>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with `ellipsis` set to `true`", () => {
    const { container } = render_test_with_provider(
      <Typography ellipsis>Test</Typography>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Typography>Test</Typography>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders with level `body1`, color `major`, and ellipsis `false` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography data-testid={"typography"}>Test</Typography>
    );

    const typography = getByTestId("typography");

    expect(typography).toHaveClass(...["t-body-1", "t-major"]);
    expect(typography).not.toHaveClass("ellipsis");
  });

  TYPOGRAPHY_LEVELS.forEach((level) => {
    it(`renders \`${level}\` level`, () => {
      const { getByTestId } = render_test_with_provider(
        <Typography data-testid={"typography"} level={level}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(
        TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[level]!
      );
    });
  });

  TYPOGRAPHY_SCALES.forEach((scale) => {
    it(`renders \`${scale}\` scale`, () => {
      const { getByTestId } = render_test_with_provider(
        <Typography data-testid={"typography"} scale={scale}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(
        TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP[scale]!
      );
    });
  });

  (
    [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "span",
      "div",
      "code"
    ] as TypographyElement[]
  ).forEach((element) => {
    it(`renders as ${element} element`, () => {
      const { getByTestId } = render_test_with_provider(
        <Typography as={element} data-testid={"typography"}>
          Test
        </Typography>
      );

      expect(getByTestId("typography").nodeName.toLowerCase()).toEqual(element);
    });
  });

  (
    [
      ["major", "t-major"],
      ["minor", "t-minor"],
      ["muted", "t-muted"],
      ["legible", "t-legible-fg"]
    ] as [TypographyColor, string][]
  ).forEach(([color, className]) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = render_test_with_provider(
        <Typography color={color} data-testid={"typography"}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(className);
    });
  });

  (
    [
      ["regular", "t-regular"],
      ["medium", "t-medium"],
      ["bold", "t-bold"]
    ] as [TypographyWeight, string][]
  ).forEach(([weight, className]) => {
    it(`renders \`${weight}\` weight`, () => {
      const { getByTestId } = render_test_with_provider(
        <Typography data-testid={"typography"} weight={weight}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(className);
    });
  });

  it("renders a custom element", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography as={"div"} data-testid={"typography"}>
        Test
      </Typography>
    );

    expect(getByTestId("typography").nodeName.toLowerCase()).toEqual("div");
  });

  describe("nested", () => {
    it("renders as a span element when nested", () => {
      const { getByTestId } = render_test_with_provider(
        <Typography>
          <Typography data-testid={"nested"}>Nested</Typography>
        </Typography>
      );

      expect(getByTestId("nested").nodeName.toLowerCase()).toEqual("span");
    });

    it("element prop overrides the nested span element", () => {
      const { getByTestId } = render_test_with_provider(
        <Typography>
          <Typography as={"code"} data-testid={"nested"}>
            Nested
          </Typography>
        </Typography>
      );

      expect(getByTestId("nested").nodeName.toLowerCase()).toEqual("code");
    });

    it("does not render as a span element for inline code and blockquote", () => {
      const { getByTestId } = render_test_with_provider(
        <Typography>
          <Typography data-testid={"nested"} level={"inline-code"}>
            Nested
          </Typography>
        </Typography>
      );

      expect(getByTestId("nested").nodeName.toLowerCase()).toEqual("code");
    });
  });

  it("renders with a truncated text when using the ellipsis prop", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography data-testid={"typography"} ellipsis>
        Text
      </Typography>
    );

    expect(getByTestId("typography")).toHaveClass("ellipsis");
  });

  it("renders color preview when a hex color code is passed to the inline code element", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography data-testid={"typography"} level={"inline-code"}>
        #000
      </Typography>
    );

    expect(getByTestId("typography")).toHaveStyle({
      "--color": "#000"
    });
  });

  it("scale prop overrides the level prop", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography data-testid={"typography"} level={"body2"} scale={"display1"}>
        Test
      </Typography>
    );

    const typography = getByTestId("typography");

    expect(typography).toHaveClass(
      TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP["display1"]!
    );
    expect(typography).not.toHaveClass(
      TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP["body2"]!
    );
  });

  it("renders mention and adds a @ prefix", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography
        data-testid={"typography"}
        level={"mention"}
        slot_props={
          {
            link: {
              "data-testid": "link"
            }
          } as TypographyProps["slot_props"]
        }
      >
        test
      </Typography>
    );

    const link = getByTestId("link");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(getByTestId("typography")).toHaveTextContent(/^@test$/);
  });

  it("renders tag and adds a # prefix", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography
        data-testid={"typography"}
        level={"tag"}
        slot_props={
          {
            link: {
              "data-testid": "link"
            }
          } as TypographyProps["slot_props"]
        }
      >
        test
      </Typography>
    );

    const link = getByTestId("link");

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/tag/test");
    expect(getByTestId("typography")).toHaveTextContent(/^#test$/);
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography
        level={"mention"}
        slot_props={
          {
            link: {
              "data-testid": "link"
            }
          } as TypographyProps["slot_props"]
        }
      >
        test
      </Typography>
    );

    expect(getByTestId("link")).toBeInTheDocument();
  });

  it("passes props to the ellipsis slot", () => {
    const { getByTestId } = render_test_with_provider(
      <Typography
        ellipsis
        slot_props={
          {
            ellipsis_cell: {
              "data-testid": "ellipsis-cell"
            }
          } as TypographyProps["slot_props"]
        }
      >
        test
      </Typography>
    );

    expect(getByTestId("ellipsis-cell")).toBeInTheDocument();
  });
});
