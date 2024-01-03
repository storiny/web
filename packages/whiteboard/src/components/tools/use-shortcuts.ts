import { useSetAtom as use_set_atom } from "jotai";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";

import { tool_atom } from "../../atoms";
import { Tool } from "../../constants";

/**
 * Hook for using and mutating a tool using its shortcut key
 * @param tool Tool
 * @param key Shortcut key
 */
const use_tool_key = (tool: Tool, key: string): void => {
  const set_tool = use_set_atom(tool_atom);
  use_hot_keys(key, () => set_tool(tool));
};

/**
 * Hook for handling selection of tools using their shortcut keys
 */
export const use_shortcuts = (): void => {
  use_tool_key(Tool.SELECT, "v");
  use_tool_key(Tool.HAND, "h");
  use_tool_key(Tool.PEN, "p");
  use_tool_key(Tool.RECTANGLE, "r");
  use_tool_key(Tool.DIAMOND, "d");
  use_tool_key(Tool.ELLIPSE, "o");
  use_tool_key(Tool.LINE, "l");
  use_tool_key(Tool.ARROW, "shift+l");
};
