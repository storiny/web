import * as exportUtils from "../../../lib/scene/export/export";
import { NonDeletedExcalidrawLayer } from "../../layer/types";
import {
  diamondFixture,
  ellipseFixture,
  rectangleWithLinkFixture
} from "../fixtures/layerFixture";

describe("exportToSvg", () => {
  window.EXCALIDRAW_ASSET_PATH = "/";
  const ELEMENT_HEIGHT = 100;
  const ELEMENT_WIDTH = 100;
  const ELEMENTS = [
    { ...diamondFixture, height: ELEMENT_HEIGHT, width: ELEMENT_WIDTH },
    { ...ellipseFixture, height: ELEMENT_HEIGHT, width: ELEMENT_WIDTH }
  ] as NonDeletedExcalidrawLayer[];

  const DEFAULT_OPTIONS = {
    exportBackground: false,
    viewBackgroundColor: "#ffffff",
    files: {}
  };

  it("with default arguments", async () => {
    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      DEFAULT_OPTIONS,
      null
    );

    expect(svgLayer).toMatchSnapshot();
  });

  it("with background color", async () => {
    const BACKGROUND_COLOR = "#abcdef";

    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportBackground: true,
        viewBackgroundColor: BACKGROUND_COLOR
      },
      null
    );

    expect(svgLayer.querySelector("rect")).toHaveAttribute(
      "fill",
      BACKGROUND_COLOR
    );
  });

  it("with dark mode", async () => {
    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportWithDarkMode: true
      },
      null
    );

    expect(svgLayer.getAttribute("filter")).toMatchInlineSnapshot(
      `"themeFilter"`
    );
  });

  it("with exportPadding", async () => {
    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportPadding: 0
      },
      null
    );

    expect(svgLayer).toHaveAttribute("height", ELEMENT_HEIGHT.toString());
    expect(svgLayer).toHaveAttribute("width", ELEMENT_WIDTH.toString());
    expect(svgLayer).toHaveAttribute(
      "viewBox",
      `0 0 ${ELEMENT_WIDTH} ${ELEMENT_HEIGHT}`
    );
  });

  it("with scale", async () => {
    const SCALE = 2;

    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportPadding: 0,
        exportScale: SCALE
      },
      null
    );

    expect(svgLayer).toHaveAttribute(
      "height",
      (ELEMENT_HEIGHT * SCALE).toString()
    );
    expect(svgLayer).toHaveAttribute(
      "width",
      (ELEMENT_WIDTH * SCALE).toString()
    );
  });

  it("with exportEmbedScene", async () => {
    const svgLayer = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportEmbedScene: true
      },
      null
    );
    expect(svgLayer.innerHTML).toMatchSnapshot();
  });

  it("with layers that have a link", async () => {
    const svgLayer = await exportUtils.exportToSvg(
      [rectangleWithLinkFixture],
      DEFAULT_OPTIONS,
      null
    );
    expect(svgLayer.innerHTML).toMatchSnapshot();
  });
});
