import "./ContextMenu.scss";

import clsx from "clsx";
import React from "react";

import { ActionManager } from "../actions/manager";
import {
  getShortcutFromShortcutName,
  ShortcutName
} from "../actions/shortcuts";
import { Action } from "../actions/types";
import { t } from "../i18n";
import {
  useExcalidrawAppState,
  useExcalidrawLayers,
  useExcalidrawSetAppState
} from "./App";
import { Popover } from "./Popover";

export type ContextMenuItem = typeof CONTEXT_MENU_SEPARATOR | Action;

export type ContextMenuItems = (ContextMenuItem | false | null | undefined)[];

type ContextMenuProps = {
  actionManager: ActionManager;
  items: ContextMenuItems;
  left: number;
  top: number;
};

export const CONTEXT_MENU_SEPARATOR = "separator";

export const ContextMenu = React.memo(
  ({ actionManager, items, top, left }: ContextMenuProps) => {
    const editorState = useExcalidrawAppState();
    const setAppState = useExcalidrawSetAppState();
    const layers = useExcalidrawLayers();

    const filteredItems = items.reduce((acc: ContextMenuItem[], item) => {
      if (
        item &&
        (item === CONTEXT_MENU_SEPARATOR ||
          !item.predicate ||
          item.predicate(
            layers,
            editorState,
            actionManager.app.props,
            actionManager.app
          ))
      ) {
        acc.push(item);
      }
      return acc;
    }, []);

    return (
      <Popover
        fitInViewport={true}
        left={left}
        offsetLeft={editorState.offsetLeft}
        offsetTop={editorState.offsetTop}
        onCloseRequest={() => setAppState({ contextMenu: null })}
        top={top}
        viewportHeight={editorState.height}
        viewportWidth={editorState.width}
      >
        <ul
          className="context-menu"
          onContextMenu={(event) => event.preventDefault()}
        >
          {filteredItems.map((item, idx) => {
            if (item === CONTEXT_MENU_SEPARATOR) {
              if (
                !filteredItems[idx - 1] ||
                filteredItems[idx - 1] === CONTEXT_MENU_SEPARATOR
              ) {
                return null;
              }
              return <hr className="context-menu-item-separator" key={idx} />;
            }

            const actionName = item.name;
            let label = "";
            if (item.contextItemLabel) {
              if (typeof item.contextItemLabel === "function") {
                label = t(item.contextItemLabel(layers, editorState));
              } else {
                label = t(item.contextItemLabel);
              }
            }

            return (
              <li
                data-testid={actionName}
                key={idx}
                onClick={() => {
                  // we need update state before executing the action in case
                  // the action uses the editorState it's being passed (that still
                  // contains a defined contextMenu) to return the next state.
                  setAppState({ contextMenu: null }, () => {
                    actionManager.executeAction(item, "contextMenu");
                  });
                }}
              >
                <button
                  className={clsx("context-menu-item", {
                    dangerous: actionName === "deleteSelectedLayers",
                    checkmark: item.checked?.(editorState)
                  })}
                >
                  <div className="context-menu-item__label">{label}</div>
                  <kbd className="context-menu-item__shortcut">
                    {actionName
                      ? getShortcutFromShortcutName(actionName as ShortcutName)
                      : ""}
                  </kbd>
                </button>
              </li>
            );
          })}
        </ul>
      </Popover>
    );
  }
);
