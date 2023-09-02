import { createDOMRange, createRectsFromDOMRange } from "@lexical/selection";
import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { $isLineBreakNode, NodeKey, NodeMap } from "lexical";

import { getCdnUrl } from "~/utils/getCdnUrl";

import { Binding } from "../../collab/bindings";
import { Provider } from "../../collab/provider";
import { createAbsolutePosition } from "../create-absolute-position";
import { getCollabNodeAndOffset } from "../get-collab-node-and-offset";
import styles from "./styles.module.scss";

export interface CursorSelection {
  anchor: {
    key: NodeKey;
    offset: number;
  };
  caret: HTMLElement;
  color: string;
  focus: {
    key: NodeKey;
    offset: number;
  };
  name: HTMLSpanElement;
  selections: Array<HTMLElement>;
}

export interface Cursor {
  avatarHex: string | null;
  avatarId: string | null;
  color: string;
  name: string;
  selection: null | CursorSelection;
}

/**
 * Creates a new cursor
 * @param props Cursor props
 */
const createCursor = (
  props: Pick<Cursor, "color" | "name" | "avatarHex" | "avatarId">
): Cursor => ({
  ...props,
  selection: null
});

/**
 * Destroys a selection
 * @param binding Binding
 * @param selection Selection
 */
const destroySelection = (
  binding: Binding,
  selection: CursorSelection
): void => {
  const cursorsContainer = binding.cursorsContainer;

  if (cursorsContainer !== null) {
    const selections = selection.selections;
    const selectionsLength = selections.length;

    for (let i = 0; i < selectionsLength; i++) {
      cursorsContainer.removeChild(selections[i]);
    }
  }
};

/**
 * Destroys a cursor
 * @param binding Binding
 * @param cursor Cursor
 */
const destroyCursor = (binding: Binding, cursor: Cursor): void => {
  const selection = cursor.selection;

  if (selection !== null) {
    destroySelection(binding, selection);
  }
};

/**
 * Creates cursor selection
 * @param cursor
 * @param anchorKey
 * @param anchorOffset
 * @param focusKey
 * @param focusOffset
 */
const createCursorSelection = (
  cursor: Cursor,
  anchorKey: NodeKey,
  anchorOffset: number,
  focusKey: NodeKey,
  focusOffset: number
): CursorSelection => {
  const color = cursor.color;

  const caret = document.createElement("span");
  caret.className = styles.caret;
  caret.style.setProperty("--color", color);

  const wrapper = document.createElement("span");
  wrapper.className = clsx("flex-center", styles.wrapper);

  if (cursor.avatarId) {
    const avatar = document.createElement("img");
    avatar.src = getCdnUrl(cursor.avatarId, ImageSize.W_32);
    avatar.className = styles.avatar;

    wrapper.appendChild(avatar);
  }

  const name = document.createElement("span");
  name.textContent = cursor.name;
  name.className = clsx("ellipsis", styles.name);

  wrapper.appendChild(name);
  caret.appendChild(wrapper);

  return {
    anchor: {
      key: anchorKey,
      offset: anchorOffset
    },
    caret,
    color,
    focus: {
      key: focusKey,
      offset: focusOffset
    },
    name,
    selections: []
  };
};

/**
 * Updates a cursor
 * @param binding
 * @param cursor
 * @param nextSelection
 * @param nodeMap
 */
const updateCursor = (
  binding: Binding,
  cursor: Cursor,
  nextSelection: null | CursorSelection,
  nodeMap: NodeMap
): void => {
  const editor = binding.editor;
  const rootElement = editor.getRootElement();
  const cursorsContainer = binding.cursorsContainer;

  if (cursorsContainer === null || rootElement === null) {
    return;
  }

  const cursorsContainerOffsetParent = cursorsContainer.offsetParent;

  if (cursorsContainerOffsetParent === null) {
    return;
  }

  const containerRect = cursorsContainerOffsetParent.getBoundingClientRect();
  const prevSelection = cursor.selection;

  if (nextSelection === null) {
    if (prevSelection === null) {
      return;
    }

    cursor.selection = null;
    destroySelection(binding, prevSelection);
    return;
  }

  cursor.selection = nextSelection;

  const caret = nextSelection.caret;
  const color = nextSelection.color;
  const selections = nextSelection.selections;
  const anchor = nextSelection.anchor;
  const focus = nextSelection.focus;
  const anchorKey = anchor.key;
  const focusKey = focus.key;
  const anchorNode = nodeMap.get(anchorKey);
  const focusNode = nodeMap.get(focusKey);

  if (anchorNode == null || focusNode == null) {
    return;
  }

  let selectionRects: Array<DOMRect>;

  // In the case of a collapsed selection on a linebreak, we need
  // to improvise as the browser will return nothing here as <br>
  // apparantly take up no visual space.
  // This won't work in all cases, but it's better than just showing
  // nothing all the time.
  if (anchorNode === focusNode && $isLineBreakNode(anchorNode)) {
    const brRect = (
      editor.getElementByKey(anchorKey) as HTMLElement
    ).getBoundingClientRect();
    selectionRects = [brRect];
  } else {
    const range = createDOMRange(
      editor,
      anchorNode,
      anchor.offset,
      focusNode,
      focus.offset
    );

    if (range === null) {
      return;
    }

    selectionRects = createRectsFromDOMRange(editor, range);
  }

  const selectionsLength = selections.length;
  const selectionRectsLength = selectionRects.length;

  for (let i = 0; i < selectionRectsLength; i++) {
    const selectionRect = selectionRects[i];
    let selection = selections[i];

    if (selection === undefined) {
      selection = document.createElement("span");
      selections[i] = selection;

      const selectionBg = document.createElement("span");

      selection.appendChild(selectionBg);
      cursorsContainer.appendChild(selection);
    }

    const top = selectionRect.top - containerRect.top;
    const left = selectionRect.left - containerRect.left;
    const style = `position:absolute;top:${top}px;left:${left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;pointer-events:none;z-index:5;`;

    selection.style.cssText = style;

    (
      selection.firstChild as HTMLSpanElement
    ).style.cssText = `${style}left:0;top:0;background-color:${color};opacity:0.3;`;

    if (i === selectionRectsLength - 1) {
      if (caret.parentNode !== selection) {
        selection.appendChild(caret);
      }
    }
  }

  for (let i = selectionsLength - 1; i >= selectionRectsLength; i--) {
    const selection = selections[i];
    cursorsContainer.removeChild(selection);
    selections.pop();
  }
};

/**
 * Syncs cursor positions
 * @param binding Binding
 * @param provider Provider
 */
export const syncCursorPositions = (
  binding: Binding,
  provider: Provider
): void => {
  const awarenessStates = Array.from(provider.awareness.getStates());
  const localClientID = binding.clientID;
  const cursors = binding.cursors;
  const editor = binding.editor;
  const nodeMap = editor._editorState._nodeMap;
  const visitedClientIDs = new Set();

  for (let i = 0; i < awarenessStates.length; i++) {
    const awarenessState = awarenessStates[i];
    const [clientID, awareness] = awarenessState;

    if (clientID !== localClientID) {
      visitedClientIDs.add(clientID);

      const {
        anchorPos,
        focusPos,
        name,
        color,
        avatarId,
        avatarHex,
        focusing
      } = awareness;
      let selection = null;
      let cursor = cursors.get(clientID);

      if (cursor === undefined) {
        cursor = createCursor({ name, color, avatarId, avatarHex });
        cursors.set(clientID, cursor);
      }

      if (anchorPos !== null && focusPos !== null && focusing) {
        const anchorAbsPos = createAbsolutePosition(anchorPos, binding);
        const focusAbsPos = createAbsolutePosition(focusPos, binding);

        if (anchorAbsPos !== null && focusAbsPos !== null) {
          const [anchorCollabNode, anchorOffset] = getCollabNodeAndOffset(
            anchorAbsPos.type,
            anchorAbsPos.index
          );
          const [focusCollabNode, focusOffset] = getCollabNodeAndOffset(
            focusAbsPos.type,
            focusAbsPos.index
          );

          if (anchorCollabNode !== null && focusCollabNode !== null) {
            const anchorKey = anchorCollabNode.getKey();
            const focusKey = focusCollabNode.getKey();
            selection = cursor.selection;

            if (selection === null) {
              selection = createCursorSelection(
                cursor,
                anchorKey,
                anchorOffset,
                focusKey,
                focusOffset
              );
            } else {
              const anchor = selection.anchor;
              const focus = selection.focus;
              anchor.key = anchorKey;
              anchor.offset = anchorOffset;
              focus.key = focusKey;
              focus.offset = focusOffset;
            }
          }
        }
      }

      updateCursor(binding, cursor, selection, nodeMap);
    }
  }

  const allClientIDs = Array.from(cursors.keys());

  for (let i = 0; i < allClientIDs.length; i++) {
    const clientID = allClientIDs[i];

    if (!visitedClientIDs.has(clientID)) {
      const cursor = cursors.get(clientID);

      if (cursor !== undefined) {
        destroyCursor(binding, cursor);
        cursors.delete(clientID);
      }
    }
  }
};
