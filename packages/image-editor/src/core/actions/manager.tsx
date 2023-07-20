import React from "react";

import { EditorClassProperties, EditorState, Layer } from "../../types";
import {
  Action,
  ActionName,
  ActionResult,
  ActionSource,
  PanelComponentProps,
  UpdaterFn
} from "./types";

export class ActionManager {
  actions = {} as Record<ActionName, Action>;

  updater: (actionResult: ActionResult | Promise<ActionResult>) => void;
  getEditorState: () => Readonly<EditorState>;
  getLayersIncludingDeleted: () => Layer[];
  app: EditorClassProperties;

  constructor(
    updater: UpdaterFn,
    getEditorState: () => EditorState,
    getLayersIncludingDeleted: () => Layer[],
    app: EditorClassProperties
  ) {
    this.updater = (actionResult): void => {
      if (actionResult && "then" in actionResult) {
        actionResult.then((actionResult) => updater(actionResult));
      } else {
        return updater(actionResult);
      }
    };

    this.getEditorState = getEditorState;
    this.getLayersIncludingDeleted = getLayersIncludingDeleted;
    this.app = app;
  }

  registerAction(action: Action): void {
    this.actions[action.name] = action;
  }

  registerAll(actions: readonly Action[]): void {
    actions.forEach((action) => this.registerAction(action));
  }

  handleKeyDown(event: React.KeyboardEvent | KeyboardEvent): boolean {
    const canvasActions = {
      changeViewBackgroundColor: true,
      clearCanvas: true,
      export: { saveFileToDisk: true },
      loadScene: true,
      saveToActiveFile: true,
      toggleTheme: null,
      saveAsImage: true
    };

    const data = Object.values(this.actions)
      .sort((a, b) => (b.keyPriority || 0) - (a.keyPriority || 0))
      .filter(
        (action) =>
          (action.name in canvasActions
            ? canvasActions[action.name as keyof typeof canvasActions]
            : true) &&
          action.keyTest &&
          action.keyTest(
            event,
            this.getEditorState(),
            this.getLayersIncludingDeleted()
          )
      );

    if (data.length !== 1) {
      if (data.length > 1) {
        console.warn("Canceling as multiple actions match this shortcut", data);
      }
      return false;
    }

    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getEditorState();
    const value = null;

    event.preventDefault();
    event.stopPropagation();
    this.updater(data[0].perform(layers, editorState, value, this.app));
    return true;
  }

  executeAction(
    action: Action,
    source: ActionSource = "api",
    value: any = null
  ): void {
    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getEditorState();

    this.updater(action.perform(layers, editorState, value, this.app));
  }

  /**
   * @param data additional data sent to the PanelComponent
   */
  renderAction = (
    name: ActionName,
    data?: PanelComponentProps["data"]
  ): React.ReactElement | null => {
    const canvasActions = {
      changeViewBackgroundColor: true,
      clearCanvas: true,
      export: { saveFileToDisk: true },
      loadScene: true,
      saveToActiveFile: true,
      toggleTheme: null,
      saveAsImage: true
    };

    if (
      this.actions[name] &&
      "PanelComponent" in this.actions[name] &&
      (name in canvasActions
        ? canvasActions[name as keyof typeof canvasActions]
        : true)
    ) {
      const action = this.actions[name];
      const PanelComponent = action.PanelComponent!;
      PanelComponent.displayName = "PanelComponent";
      const updateData = (formState?: any): void => {
        this.updater(
          action.perform(
            this.getLayersIncludingDeleted(),
            this.getEditorState(),
            formState,
            this.app
          )
        );
      };

      return (
        <PanelComponent
          data={data}
          editorState={this.getEditorState()}
          layers={this.getLayersIncludingDeleted()}
          updateData={updateData}
        />
      );
    }

    return null;
  };

  isActionEnabled = (action: Action): boolean => {
    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getEditorState();

    return !action.predicate || action.predicate(layers, editorState);
  };
}
