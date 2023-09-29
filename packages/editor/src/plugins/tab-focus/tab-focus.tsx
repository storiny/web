import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  $setSelection as $set_selection,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND
} from "lexical";
import React from "react";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";

const TAB_TO_FOCUS_INTERVAL = 100;

const TabFocusPlugin = (): null => {
  const [editor] = use_lexical_composer_context();
  const last_tab_key_down_timestamp_ref = React.useRef<number>(0);

  use_hot_keys(
    "tab",
    (keyboard_event) =>
      (last_tab_key_down_timestamp_ref.current = keyboard_event.timeStamp),
    {
      enableOnContentEditable: true
    }
  );

  React.useEffect(
    () =>
      editor.registerCommand(
        FOCUS_COMMAND,
        (event: FocusEvent) => {
          const selection = $get_selection();
          if ($is_range_selection(selection)) {
            if (
              last_tab_key_down_timestamp_ref.current + TAB_TO_FOCUS_INTERVAL >
              event.timeStamp
            ) {
              $set_selection(selection.clone());
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
