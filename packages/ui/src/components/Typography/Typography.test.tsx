import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { levelToClassNameMap, scaleToClassNameMap } from "../common/typography";
import Typography from "./Typography";
import {
  TypographyColor,
  TypographyElement,
  TypographyLevel,
  TypographyProps,
  TypographyScale,
} from "./Typography.props";

const typographyScales = Object.keys(scaleToClassNameMap) as TypographyScale[];
const typographyLevels = Object.keys(levelToClassNameMap) as TypographyLevel[];

describe("<Typography />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Typography>Test</Typography>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Typography>Test</Typography>);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders with level `body1`, color `major`, and ellipsis `false` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Typography data-testid={"typography"}>Test</Typography>
    );

    const typography = getByTestId("typography");

    expect(typography).toHaveClass(...["t-body-1", "t-major"]);
    expect(typography).not.toHaveClass("ellipsis");
  });

  typographyLevels.forEach((level) => {
    it(`renders \`${level}\` level`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Typography data-testid={"typography"} level={level}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(
        levelToClassNameMap[level]!
      );
    });
  });

  typographyScales.forEach((scale) => {
    it(`renders \`${scale}\` scale`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Typography data-testid={"typography"} scale={scale}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(
        scaleToClassNameMap[scale]!
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
      "code",
    ] as TypographyElement[]
  ).forEach((element) => {
    it(`renders as ${element} element`, () => {
      const { getByTestId } = renderTestWithProvider(
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
      ["legible", "t-legible-fg"],
    ] as [TypographyColor, string][]
  ).forEach(([color, className]) => {
    it(`renders \`${color}\` color`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Typography color={color} data-testid={"typography"}>
          Test
        </Typography>
      );

      expect(getByTestId("typography")).toHaveClass(className);
    });
  });

  it("renders a custom element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Typography as={"div"} data-testid={"typography"}>
        Test
      </Typography>
    );

    expect(getByTestId("typography").nodeName.toLowerCase()).toEqual("div");
  });

  describe("nested", () => {
    it("renders as a span element when nested", () => {
      const { getByTestId } = renderTestWithProvider(
        <Typography>
          <Typography data-testid={"nested"}>Nested</Typography>
        </Typography>
      );

      expect(getByTestId("nested").nodeName.toLowerCase()).toEqual("span");
    });

    it("element prop overrides the nested span element", () => {
      const { getByTestId } = renderTestWithProvider(
        <Typography>
          <Typography as={"code"} data-testid={"nested"}>
            Nested
          </Typography>
        </Typography>
      );

      expect(getByTestId("nested").nodeName.toLowerCase()).toEqual("code");
    });

    it("does not render as a span element for inline code and blockquote", () => {
      const { getByTestId } = renderTestWithProvider(
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
    const { getByTestId } = renderTestWithProvider(
      <Typography data-testid={"typography"} ellipsis>
        Text
      </Typography>
    );

    expect(getByTestId("typography")).toHaveClass("ellipsis");
  });

  it("renders color preview when a hex color code is passed to the inline code element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Typography data-testid={"typography"} level={"inline-code"}>
        #000
      </Typography>
    );

    expect(getByTestId("typography")).toHaveStyle({
      "--color": "#000",
    });
  });

  it("scale prop overrides the level prop", () => {
    const { getByTestId } = renderTestWithProvider(
      <Typography data-testid={"typography"} level={"body2"} scale={"display1"}>
        Test
      </Typography>
    );

    const typography = getByTestId("typography");

    expect(typography).toHaveClass(scaleToClassNameMap["display1"]!);
    expect(typography).not.toHaveClass(levelToClassNameMap["body2"]!);
  });

  it("renders mention and adds a @ prefix", () => {
    const { getByTestId } = renderTestWithProvider(
      <Typography
        data-testid={"typography"}
        level={"mention"}
        slotProps={
          {
            link: {
              "data-testid": "link",
            },
          } as TypographyProps["slotProps"]
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
    const { getByTestId } = renderTestWithProvider(
      <Typography
        data-testid={"typography"}
        level={"tag"}
        slotProps={
          {
            link: {
              "data-testid": "link",
            },
          } as TypographyProps["slotProps"]
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
    const { getByTestId } = renderTestWithProvider(
      <Typography
        data-testid={"typography"}
        level={"mention"}
        slotProps={
          {
            link: {
              "data-testid": "link",
            },
          } as TypographyProps["slotProps"]
        }
      >
        test
      </Typography>
    );

    expect(getByTestId("link")).toBeInTheDocument();
  });
});
