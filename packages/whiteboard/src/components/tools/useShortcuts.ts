import { useSetAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { toolAtom } from "../../atoms";
import { Tool } from "../../constants";

/**
 * Hooks for using and mutating a tool using its shortcut key
 * @param tool Tool
 * @param key Shortcut key
 */
const useToolKey = (tool: Tool, key: string): void => {
  const setTool = use_set_atom(toolAtom);
  useHotkeys(key, () => setTool(tool));
};

/**
 * Hooks for handling selection of tools using their shortcut keys
 */
export const useShortcuts = (): void => {
  useToolKey(Tool.SELECT, "v");
  useToolKey(Tool.HAND, "h");
  useToolKey(Tool.PEN, "p");
  useToolKey(Tool.RECTANGLE, "r");
  useToolKey(Tool.DIAMOND, "d");
  useToolKey(Tool.ELLIPSE, "o");
  useToolKey(Tool.LINE, "l");
  useToolKey(Tool.ARROW, "shift+l");
};
