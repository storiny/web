"use client";

import { getShortcutKey } from "@storiny/shared/src/utils/getShortcutKey";
import { useSetAtom } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import { sidebarsCollapsedAtom } from "../atoms";

const EditorShortcuts = (): null => {
  const setCollapsed = useSetAtom(sidebarsCollapsedAtom);
  useHotkeys(getShortcutKey({ cmd: true, key: "\\" }), () =>
    setCollapsed((prev) => !prev)
  );

  return null;
};

export default EditorShortcuts;
