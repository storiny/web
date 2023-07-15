import { buildQueries, queries } from "@testing-library/react";

const toolMap = {
  lock: "lock",
  selection: "selection",
  rectangle: "rectangle",
  diamond: "diamond",
  ellipse: "ellipse",
  arrow: "arrow",
  line: "line",
  freedraw: "freedraw",
  text: "text",
  eraser: "eraser",
  frame: "frame"
};

export type ToolName = keyof typeof toolMap;

const _getAllByToolName = (container: HTMLLayer, tool: string) => {
  const toolTitle = toolMap[tool as ToolName];
  return queries.getAllByTestId(container, `toolbar-${toolTitle}`);
};

const getMultipleError = (_container: any, tool: any) =>
  `Found multiple layers with tool name: ${tool}`;
const getMissingError = (_container: any, tool: any) =>
  `Unable to find an layer with tool name: ${tool}`;

export const [
  queryByToolName,
  getAllByToolName,
  getByToolName,
  findAllByToolName,
  findByToolName
] = buildQueries<string[]>(
  _getAllByToolName,
  getMultipleError,
  getMissingError
);
