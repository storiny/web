import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND
} from "lexical";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";

const TAB_TO_FOCUS_INTERVAL = 100;

const TabFocusPlugin = (): null => {
  const [editor] = useLexicalComposerContext();
  const lastTabKeyDownTimestampRef = React.useRef<number>(0);

  useHotkeys(
    "tab",
    (keyboardEvent) =>
      (lastTabKeyDownTimestampRef.current = keyboardEvent.timeStamp),
    {
      enableOnContentEditable: true
    }
  );

  React.useEffect(
    () =>
      editor.registerCommand(
        FOCUS_COMMAND,
        (event: FocusEvent) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            if (
              lastTabKeyDownTimestampRef.current + TAB_TO_FOCUS_INTERVAL >
              event.timeStamp
            ) {
              $setSelection(selection.clone());
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
    [editor]
  );

  return null;
};

export default TabFocusPlugin;
