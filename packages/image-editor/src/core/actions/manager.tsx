import React from "react";

import { trackEvent } from "../analytics";
import { ExcalidrawLayer } from "../layer/types";
import { AppClassProperties, AppState } from "../types";
import {
  Action,
  ActionName,
  ActionResult,
  ActionSource,
  PanelComponentProps,
  UpdaterFn
} from "./types";

const trackAction = (
  action: Action,
  source: ActionSource,
  editorState: Readonly<AppState>,
  layers: readonly ExcalidrawLayer[],
  app: AppClassProperties,
  value: any
) => {
  if (action.trackEvent) {
    try {
      if (typeof action.trackEvent === "object") {
        const shouldTrack = action.trackEvent.predicate
          ? action.trackEvent.predicate(editorState, layers, value)
          : true;
        if (shouldTrack) {
          trackEvent(
            action.trackEvent.category,
            action.trackEvent.action || action.name,
            `${source} (${app.device.isMobile ? "mobile" : "desktop"})`
          );
        }
      }
    } catch (error) {
      console.error("error while logging action:", error);
    }
  }
};

export class ActionManager {
  actions = {} as Record<ActionName, Action>;

  updater: (actionResult: ActionResult | Promise<ActionResult>) => void;

  getAppState: () => Readonly<AppState>;
  getLayersIncludingDeleted: () => readonly ExcalidrawLayer[];
  app: AppClassProperties;

  constructor(
    updater: UpdaterFn,
    getAppState: () => AppState,
    getLayersIncludingDeleted: () => readonly ExcalidrawLayer[],
    app: AppClassProperties
  ) {
    this.updater = (actionResult) => {
      if (actionResult && "then" in actionResult) {
        actionResult.then((actionResult) => updater(actionResult));
      } else {
        return updater(actionResult);
      }
    };
    this.getAppState = getAppState;
    this.getLayersIncludingDeleted = getLayersIncludingDeleted;
    this.app = app;
  }

  registerAction(action: Action) {
    this.actions[action.name] = action;
  }

  registerAll(actions: readonly Action[]) {
    actions.forEach((action) => this.registerAction(action));
  }

  handleKeyDown(event: React.KeyboardEvent | KeyboardEvent) {
    const canvasActions = this.app.props.UIOptions.canvasActions;
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
            this.getAppState(),
            this.getLayersIncludingDeleted()
          )
      );

    if (data.length !== 1) {
      if (data.length > 1) {
        console.warn("Canceling as multiple actions match this shortcut", data);
      }
      return false;
    }

    const action = data[0];

    if (this.getAppState().viewModeEnabled && action.viewMode !== true) {
      return false;
    }

    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getAppState();
    const value = null;

    trackAction(action, "keyboard", editorState, layers, this.app, null);

    event.preventDefault();
    event.stopPropagation();
    this.updater(data[0].perform(layers, editorState, value, this.app));
    return true;
  }

  executeAction(
    action: Action,
    source: ActionSource = "api",
    value: any = null
  ) {
    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getAppState();

    trackAction(action, source, editorState, layers, this.app, value);

    this.updater(action.perform(layers, editorState, value, this.app));
  }

  /**
   * @param data additional data sent to the PanelComponent
   */
  renderAction = (name: ActionName, data?: PanelComponentProps["data"]) => {
    const canvasActions = this.app.props.UIOptions.canvasActions;

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
      const layers = this.getLayersIncludingDeleted();
      const editorState = this.getAppState();
      const updateData = (formState?: any) => {
        trackAction(action, "ui", editorState, layers, this.app, formState);

        this.updater(
          action.perform(
            this.getLayersIncludingDeleted(),
            this.getAppState(),
            formState,
            this.app
          )
        );
      };

      return (
        <PanelComponent
          appProps={this.app.props}
          data={data}
          editorState={this.getAppState()}
          layers={this.getLayersIncludingDeleted()}
          updateData={updateData}
        />
      );
    }

    return null;
  };

  isActionEnabled = (action: Action) => {
    const layers = this.getLayersIncludingDeleted();
    const editorState = this.getAppState();

    return (
      !action.predicate ||
      action.predicate(layers, editorState, this.app.props, this.app)
    );
  };
}
