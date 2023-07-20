import React from "react";

import {
  BringForwardIcon,
  BringToFrontIcon,
  SendBackwardIcon,
  SendToBackIcon
} from "../../components/core/icons";
import { KeyCode, KEYS } from "../../constants";
import { moveOneLeft } from "../../lib";
import { isDarwin } from "../constants";
import { register } from "./register";

export const actionSendBackward = register({
  name: "sendBackward",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    layers: moveOneLeft(layers, editorState),
    editorState,
    commitToHistory: true
  }),
  contextItemLabel: "labels.sendBackward",
  keyPriority: 40,
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    !event.shiftKey &&
    event.code === CODES.BRACKET_LEFT,
  PanelComponent: ({ updateData, editorState }) => (
    <button
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.sendBackward")} — ${getShortcutKey("CtrlOrCmd+[")}`}
      type="button"
    >
      {SendBackwardIcon}
    </button>
  )
});

export const actionBringForward = register({
  name: "bringForward",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    layers: moveOneRight(layers, editorState),
    editorState,
    commitToHistory: true
  }),
  contextItemLabel: "labels.bringForward",
  keyPriority: 40,
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    !event.shiftKey &&
    event.code === CODES.BRACKET_RIGHT,
  PanelComponent: ({ updateData, editorState }) => (
    <button
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.bringForward")} — ${getShortcutKey("CtrlOrCmd+]")}`}
      type="button"
    >
      {BringForwardIcon}
    </button>
  )
});

export const actionSendToBack = register({
  name: "sendToBack",
  trackEvent: { category: "layer" },
  perform: (layers, editorState) => ({
    layers: moveAllLeft(layers, editorState),
    editorState,
    commitToHistory: true
  }),
  contextItemLabel: "labels.sendToBack",
  keyTest: (event) =>
    isDarwin
      ? event[KEYS.CTRL_OR_CMD] &&
        event.altKey &&
        event.code === CODES.BRACKET_LEFT
      : event[KEYS.CTRL_OR_CMD] &&
        event.shiftKey &&
        event.code === CODES.BRACKET_LEFT,
  PanelComponent: ({ updateData, editorState }) => (
    <button
      className="zIndexButton"
      onClick={() => updateData(null)}
      title={`${t("labels.sendToBack")} — ${
        isDarwin
          ? getShortcutKey("CtrlOrCmd+Alt+[")
          : getShortcutKey("CtrlOrCmd+Shift+[")
      }`}
      type="button"
    >
      {SendToBackIcon}
    </button>
  )
});

export const actionBringToFront = register({
  name: "bringToFront",
  trackEvent: { category: "layer" },

  perform: (layers, editorState) => ({
    layers: moveAllRight(layers, editorState),
    editorState,
    commitToHistory: true
  }),
  contextItemLabel: "labels.bringToFront",
  keyTest: (event) =>
    isDarwin
      ? event[KEYS.CTRL_OR_CMD] &&
        event.altKey &&
        event.code === CODES.BRACKET_RIGHT
      : event[KEYS.CTRL_OR_CMD] &&
        event.shiftKey &&
        event.code === CODES.BRACKET_RIGHT,
  PanelComponent: ({ updateData, editorState }) => (
    <button
      className="zIndexButton"
      onClick={(event) => updateData(null)}
      title={`${t("labels.bringToFront")} — ${
        isDarwin
          ? getShortcutKey("CtrlOrCmd+Alt+]")
          : getShortcutKey("CtrlOrCmd+Shift+]")
      }`}
      type="button"
    >
      {BringToFrontIcon}
    </button>
  )
});
