import {
  ChartType,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  FillStyle,
  LayerType,
  StrokeStyle,
  TextAlign,
  VerticalAlign
} from "../../constants";
import { NonDeletedLayer, Spreadsheet } from "../../types";
import { DEFAULT_CHART_COLOR_INDEX, getAllColorsSpecificShade } from "../color";
import { newLayer, newLinearLayer, newTextLayer } from "../layer";
import { randomId } from "../random";

export type ChartLayers = readonly NonDeletedLayer[];

const BAR_WIDTH = 32;
const BAR_GAP = 12;
const BAR_HEIGHT = 256;
const GRID_OPACITY = 50;
const bgColors = getAllColorsSpecificShade(DEFAULT_CHART_COLOR_INDEX);

export const NOT_SPREADSHEET = "NOT_SPREADSHEET";
export const VALID_SPREADSHEET = "VALID_SPREADSHEET";

type ParseSpreadsheetResult =
  | { reason: string; type: typeof NOT_SPREADSHEET }
  | { spreadsheet: Spreadsheet; type: typeof VALID_SPREADSHEET };

/**
 * Exported for testing
 * @param s String
 * @private
 */
export const tryParseNumber = (s: string): number | null => {
  const match = /^([-+]?)[$€£¥₩]?([-+]?)([\d.,]+)[%]?$/.exec(s);

  if (!match) {
    return null;
  }

  return parseFloat(`${(match[1] || match[2]) + match[3]}`.replace(/,/g, ""));
};

/**
 * Predicate function for determining numeric column
 * @param lines Lines
 * @param columnIndex Column index
 */
const isNumericColumn = (lines: string[][], columnIndex: number): boolean =>
  lines.slice(1).every((line) => tryParseNumber(line[columnIndex]) !== null);

/**
 * Exported for testing
 * @param cells Cells
 * @private
 */
export const tryParseCells = (cells: string[][]): ParseSpreadsheetResult => {
  const numCols = cells[0].length;

  if (numCols > 2) {
    return { type: NOT_SPREADSHEET, reason: "More than 2 columns" };
  }

  if (numCols === 1) {
    if (!isNumericColumn(cells, 0)) {
      return { type: NOT_SPREADSHEET, reason: "Value is not numeric" };
    }

    const hasHeader = tryParseNumber(cells[0][0]) === null;
    const values = (hasHeader ? cells.slice(1) : cells).map((line) =>
      tryParseNumber(line[0])
    );

    if (values.length < 2) {
      return { type: NOT_SPREADSHEET, reason: "Less than two rows" };
    }

    return {
      type: VALID_SPREADSHEET,
      spreadsheet: {
        title: hasHeader ? cells[0][0] : null,
        labels: null,
        values: values as number[]
      }
    };
  }

  const labelColumnNumeric = isNumericColumn(cells, 0);
  const valueColumnNumeric = isNumericColumn(cells, 1);

  if (!labelColumnNumeric && !valueColumnNumeric) {
    return { type: NOT_SPREADSHEET, reason: "Value is not numeric" };
  }

  const [labelColumnIndex, valueColumnIndex] = valueColumnNumeric
    ? [0, 1]
    : [1, 0];
  const hasHeader = tryParseNumber(cells[0][valueColumnIndex]) === null;
  const rows = hasHeader ? cells.slice(1) : cells;

  if (rows.length < 2) {
    return { type: NOT_SPREADSHEET, reason: "Less than 2 rows" };
  }

  return {
    type: VALID_SPREADSHEET,
    spreadsheet: {
      title: hasHeader ? cells[0][valueColumnIndex] : null,
      labels: rows.map((row) => row[labelColumnIndex]),
      values: rows.map((row) => tryParseNumber(row[valueColumnIndex])!)
    }
  };
};

/**
 * Transposes cells
 * @param cells Cells
 */
const transposeCells = (cells: string[][]): string[][] => {
  const nextCells: string[][] = [];

  for (let col = 0; col < cells[0].length; col++) {
    const nextCellRow: string[] = [];

    for (let row = 0; row < cells.length; row++) {
      nextCellRow.push(cells[row][col]);
    }

    nextCells.push(nextCellRow);
  }

  return nextCells;
};

/**
 * Tries to parse a spreadsheet, usually pasted from Excel, Spreadsheets,
 * tsv, csv, etc.
 * @param text Spreadsheet data
 */
export const tryParseSpreadsheet = (text: string): ParseSpreadsheetResult => {
  // For now, we only accept 2 columns with an optional header

  // Check for tab separated values
  let lines = text
    .trim()
    .split("\n")
    .map((line) => line.trim().split("\t"));

  // Check for comma-separated files
  if (lines.length && lines[0].length !== 2) {
    lines = text
      .trim()
      .split("\n")
      .map((line) => line.trim().split(","));
  }

  if (lines.length === 0) {
    return { type: NOT_SPREADSHEET, reason: "No values" };
  }

  const numColsFirstLine = lines[0].length;
  const isSpreadsheet = lines.every((line) => line.length === numColsFirstLine);

  if (!isSpreadsheet) {
    return {
      type: NOT_SPREADSHEET,
      reason: "All rows don't have the same number of columns"
    };
  }

  const result = tryParseCells(lines);

  if (result.type !== VALID_SPREADSHEET) {
    const transposedResults = tryParseCells(transposeCells(lines));

    if (transposedResults.type === VALID_SPREADSHEET) {
      return transposedResults;
    }
  }

  return result;
};

// const bgColors = getAllColorsSpecificShade(DEFAULT_CHART_COLOR_INDEX);

// Put all the common properties here so when the whole chart is selected
// the properties dialog shows the correct selected values
const commonProps = {
  fillStyle: FillStyle.HACHURE,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_FONT_SIZE,
  opacity: 100,
  roughness: 1,
  strokeColor: "#000",
  roundness: null,
  strokeStyle: StrokeStyle.SOLID,
  strokeWidth: 1,
  verticalAlign: VerticalAlign.MIDDLE,
  locked: false
} as const;

/**
 * Returns chart dimensions
 * @param spreadsheet Spreadsheet
 */
const getChartDimensions = (
  spreadsheet: Spreadsheet
): { chartHeight: number; chartWidth: number } => {
  const chartWidth =
    (BAR_WIDTH + BAR_GAP) * spreadsheet.values.length + BAR_GAP;
  const chartHeight = BAR_HEIGHT + BAR_GAP * 2;
  return { chartWidth, chartHeight };
};

/**
 * Returns chart X labels
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 * @param groupId Group ID
 * @param backgroundColor Background color
 */
const chartXLabels = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number,
  groupId: string,
  backgroundColor: string
): ChartLayers =>
  spreadsheet.labels?.map((label, index) =>
    newTextLayer({
      groupIds: [groupId],
      backgroundColor,
      ...commonProps,
      text: label.length > 8 ? `${label.slice(0, 5)}...` : label,
      x: x + index * (BAR_WIDTH + BAR_GAP) + BAR_GAP * 2,
      y: y + BAR_GAP / 2,
      width: BAR_WIDTH,
      angle: 5.87,
      fontSize: 16,
      textAlign: TextAlign.CENTER,
      verticalAlign: VerticalAlign.TOP
    })
  ) || [];

/**
 * Returns chart Y labels
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 * @param groupId Group ID
 * @param backgroundColor Background color
 */
const chartYLabels = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number,
  groupId: string,
  backgroundColor: string
): ChartLayers => {
  const minYLabel = newTextLayer({
    groupIds: [groupId],
    backgroundColor,
    ...commonProps,
    x: x - BAR_GAP,
    y: y - BAR_GAP,
    text: "0",
    textAlign: TextAlign.RIGHT
  });
  const maxYLabel = newTextLayer({
    groupIds: [groupId],
    backgroundColor,
    ...commonProps,
    x: x - BAR_GAP,
    y: y - BAR_HEIGHT - minYLabel.height / 2,
    text: Math.max(...spreadsheet.values).toLocaleString(),
    textAlign: TextAlign.RIGHT
  });

  return [minYLabel, maxYLabel];
};

/**
 * Returns chart lines
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 * @param groupId Group ID
 * @param backgroundColor Background color
 */
const chartLines = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number,
  groupId: string,
  backgroundColor: string
): ChartLayers => {
  const { chartWidth, chartHeight } = getChartDimensions(spreadsheet);
  const xLine = newLinearLayer({
    backgroundColor,
    groupIds: [groupId],
    ...commonProps,
    type: LayerType.LINE,
    x,
    y,
    startArrowhead: null,
    endArrowhead: null,
    width: chartWidth,
    points: [
      [0, 0],
      [chartWidth, 0]
    ]
  });
  const yLine = newLinearLayer({
    backgroundColor,
    groupIds: [groupId],
    ...commonProps,
    type: LayerType.LINE,
    x,
    y,
    startArrowhead: null,
    endArrowhead: null,
    height: chartHeight,
    points: [
      [0, 0],
      [0, -chartHeight]
    ]
  });
  const maxLine = newLinearLayer({
    backgroundColor,
    groupIds: [groupId],
    ...commonProps,
    type: LayerType.LINE,
    x,
    y: y - BAR_HEIGHT - BAR_GAP,
    startArrowhead: null,
    endArrowhead: null,
    strokeStyle: StrokeStyle.DOTTED,
    width: chartWidth,
    opacity: GRID_OPACITY,
    points: [
      [0, 0],
      [chartWidth, 0]
    ]
  });

  return [xLine, yLine, maxLine];
};

/**
 * Returns chart base layers
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 * @param groupId Group ID
 * @param backgroundColor Background color
 * @param debug Debug flag
 */
const chartBaseLayers = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number,
  groupId: string,
  backgroundColor: string,
  debug?: boolean
): ChartLayers => {
  const { chartWidth, chartHeight } = getChartDimensions(spreadsheet);
  const title = spreadsheet.title
    ? newTextLayer({
        backgroundColor,
        groupIds: [groupId],
        ...commonProps,
        text: spreadsheet.title,
        x: x + chartWidth / 2,
        y: y - BAR_HEIGHT - BAR_GAP * 2 - DEFAULT_FONT_SIZE,
        roundness: null,
        textAlign: TextAlign.CENTER
      })
    : null;
  const debugRect = debug
    ? newLayer({
        backgroundColor,
        groupIds: [groupId],
        ...commonProps,
        type: LayerType.RECTANGLE,
        x,
        y: y - chartHeight,
        width: chartWidth,
        height: chartHeight,
        strokeColor: "#000",
        fillStyle: FillStyle.SOLID,
        opacity: 6
      })
    : null;

  return [
    ...(debugRect ? [debugRect] : []),
    ...(title ? [title] : []),
    ...chartXLabels(spreadsheet, x, y, groupId, backgroundColor),
    ...chartYLabels(spreadsheet, x, y, groupId, backgroundColor),
    ...chartLines(spreadsheet, x, y, groupId, backgroundColor)
  ];
};

/**
 * Returns bar chart
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 */
const chartTypeBar = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number
): ChartLayers => {
  const max = Math.max(...spreadsheet.values);
  const groupId = randomId();
  const backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];
  const bars = spreadsheet.values.map((value, index) => {
    const barHeight = (value / max) * BAR_HEIGHT;

    return newLayer({
      backgroundColor,
      groupIds: [groupId],
      ...commonProps,
      type: LayerType.RECTANGLE,
      x: x + index * (BAR_WIDTH + BAR_GAP) + BAR_GAP,
      y: y - barHeight - BAR_GAP,
      width: BAR_WIDTH,
      height: barHeight
    });
  });

  return [
    ...bars,
    ...chartBaseLayers(
      spreadsheet,
      x,
      y,
      groupId,
      backgroundColor,
      process.env.NODE_ENV === "development"
    )
  ];
};

/**
 * Returns line chart
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 */
const chartTypeLine = (
  spreadsheet: Spreadsheet,
  x: number,
  y: number
): ChartLayers => {
  const max = Math.max(...spreadsheet.values);
  const groupId = randomId();
  const backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];
  let index = 0;
  const points = [];

  for (const value of spreadsheet.values) {
    const cx = index * (BAR_WIDTH + BAR_GAP);
    const cy = -(value / max) * BAR_HEIGHT;

    points.push([cx, cy]);
    index++;
  }

  const maxX = Math.max(...points.map((layer) => layer[0]));
  const maxY = Math.max(...points.map((layer) => layer[1]));
  const minX = Math.min(...points.map((layer) => layer[0]));
  const minY = Math.min(...points.map((layer) => layer[1]));
  const line = newLinearLayer({
    backgroundColor,
    groupIds: [groupId],
    ...commonProps,
    type: LayerType.LINE,
    x: x + BAR_GAP + BAR_WIDTH / 2,
    y: y - BAR_GAP,
    startArrowhead: null,
    endArrowhead: null,
    height: maxY - minY,
    width: maxX - minX,
    strokeWidth: 2,
    points: points as any
  });

  const dots = spreadsheet.values.map((value, index) => {
    const cx = index * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
    const cy = -(value / max) * BAR_HEIGHT + BAR_GAP / 2;
    return newLayer({
      backgroundColor,
      groupIds: [groupId],
      ...commonProps,
      fillStyle: FillStyle.SOLID,
      strokeWidth: 2,
      type: LayerType.ELLIPSE,
      x: x + cx + BAR_WIDTH / 2,
      y: y + cy - BAR_GAP * 2,
      width: BAR_GAP,
      height: BAR_GAP
    });
  });
  const lines = spreadsheet.values.map((value, index) => {
    const cx = index * (BAR_WIDTH + BAR_GAP) + BAR_GAP / 2;
    const cy = (value / max) * BAR_HEIGHT + BAR_GAP / 2 + BAR_GAP;
    return newLinearLayer({
      backgroundColor,
      groupIds: [groupId],
      ...commonProps,
      type: LayerType.LINE,
      x: x + cx + BAR_WIDTH / 2 + BAR_GAP / 2,
      y: y - cy,
      startArrowhead: null,
      endArrowhead: null,
      height: cy,
      strokeStyle: StrokeStyle.DOTTED,
      opacity: GRID_OPACITY,
      points: [
        [0, 0],
        [0, cy]
      ]
    });
  });

  return [
    ...chartBaseLayers(
      spreadsheet,
      x,
      y,
      groupId,
      backgroundColor,
      process.env.NODE_ENV === "development"
    ),
    line,
    ...lines,
    ...dots
  ];
};

/**
 * Renders a spreadsheet
 * @param chartType Chart type
 * @param spreadsheet Spreadsheet
 * @param x X
 * @param y Y
 */
export const renderSpreadsheet = (
  chartType: ChartType,
  spreadsheet: Spreadsheet,
  x: number,
  y: number
): ChartLayers => {
  if (chartType === ChartType.LINE) {
    return chartTypeLine(spreadsheet, x, y);
  }

  return chartTypeBar(spreadsheet, x, y);
};
