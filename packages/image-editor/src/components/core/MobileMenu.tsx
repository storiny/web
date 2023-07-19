import React from "react";

import { actionToggleStats } from "../../core/actions";
import { ActionManager } from "../../core/actions/manager";
import { useTunnels } from "../../core/context/tunnels";
import {
  AppState,
  Device,
  ExcalidrawProps,
  UIAppState
} from "../../core/types";
import { calculateScrollCenter } from "../../lib/scene";
import {
  SCROLLBAR_MARGIN,
  SCROLLBAR_WIDTH
} from "../../lib/scene/scrollbars/scrollbars";
import { isHandToolActive } from "../editorState";
import { t } from "../i18n";
import { showSelectedShapeActions } from "../layer";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { SelectedShapeActions, ShapesSwitcher } from "./Actions";
import { FixedSideContainer } from "./FixedSideContainer";
import { HandButton } from "./HandButton";
import { HintViewer } from "./HintViewer";
import { Island } from "./Island";
import { LockButton } from "./LockButton";
import { PenModeButton } from "./PenModeButton";
import { Section } from "./Section";
import Stack from "./Stack";
import { Stats } from "./Stats";

type MobileMenuProps = {
  actionManager: ActionManager;
  canvas: HTMLCanvasLayer | null;
  device: Device;
  editorState: UIAppState;
  layers: readonly NonDeletedExcalidrawLayer[];
  onHandToolToggle: () => void;
  onImageAction: (data: { insertOnCanvasDirectly: boolean }) => void;
  onLockToggle: () => void;
  onPenModeToggle: () => void;
  renderCustomStats?: ExcalidrawProps["renderCustomStats"];

  renderImageExportDialog: () => React.ReactNode;
  renderJSONExportDialog: () => React.ReactNode;
  renderSidebars: () => JSX.Layer | null;
  renderTopRightUI?: (
    isMobile: boolean,
    editorState: UIAppState
  ) => JSX.Layer | null;
  renderWelcomeScreen: boolean;
  setAppState: React.Component<any, AppState>["setState"];
};

export const MobileMenu = ({
  editorState,
  layers,
  actionManager,
  setAppState,
  onLockToggle,
  onHandToolToggle,
  onPenModeToggle,
  canvas,
  onImageAction,
  renderTopRightUI,
  renderCustomStats,
  renderSidebars,
  device,
  renderWelcomeScreen
}: MobileMenuProps) => {
  const {
    WelcomeScreenCenterTunnel,
    MainMenuTunnel,
    DefaultSidebarTriggerTunnel
  } = useTunnels();
  const renderToolbar = () => (
    <FixedSideContainer className="App-top-bar" side="top">
      {renderWelcomeScreen && <WelcomeScreenCenterTunnel.Out />}
      <Section heading="shapes">
        {(heading: React.ReactNode) => (
          <Stack.Col align="center" gap={4}>
            <Stack.Row className="App-toolbar-container" gap={1}>
              <Island className="App-toolbar App-toolbar--mobile" padding={1}>
                {heading}
                <Stack.Row gap={1}>
                  <ShapesSwitcher
                    activeTool={editorState.activeTool}
                    canvas={canvas}
                    editorState={editorState}
                    onImageAction={({ pointerType }) => {
                      onImageAction({
                        insertOnCanvasDirectly: pointerType !== "mouse"
                      });
                    }}
                    setAppState={setAppState}
                  />
                </Stack.Row>
              </Island>
              {renderTopRightUI && renderTopRightUI(true, editorState)}
              <div className="mobile-misc-tools-container">
                {!editorState.viewModeEnabled && (
                  <DefaultSidebarTriggerTunnel.Out />
                )}
                <PenModeButton
                  checked={editorState.penMode}
                  isMobile
                  onChange={onPenModeToggle}
                  penDetected={editorState.penDetected}
                  title={t("toolBar.penMode")}
                />
                <LockButton
                  checked={editorState.activeTool.locked}
                  isMobile
                  onChange={onLockToggle}
                  title={t("toolBar.lock")}
                />
                <HandButton
                  checked={isHandToolActive(editorState)}
                  isMobile
                  onChange={() => onHandToolToggle()}
                  title={t("toolBar.hand")}
                />
              </div>
            </Stack.Row>
          </Stack.Col>
        )}
      </Section>
      <HintViewer
        device={device}
        editorState={editorState}
        isMobile={true}
        layers={layers}
      />
    </FixedSideContainer>
  );

  const renderAppToolbar = () => {
    if (editorState.viewModeEnabled) {
      return (
        <div className="App-toolbar-content">
          <MainMenuTunnel.Out />
        </div>
      );
    }

    return (
      <div className="App-toolbar-content">
        <MainMenuTunnel.Out />
        {actionManager.renderAction("toggleEditMenu")}
        {actionManager.renderAction("undo")}
        {actionManager.renderAction("redo")}
        {actionManager.renderAction(
          editorState.multiLayer ? "finalize" : "duplicateSelection"
        )}
        {actionManager.renderAction("deleteSelectedLayers")}
      </div>
    );
  };

  return (
    <>
      {renderSidebars()}
      {!editorState.viewModeEnabled && renderToolbar()}
      {!editorState.openMenu && editorState.showStats && (
        <Stats
          editorState={editorState}
          layers={layers}
          onClose={() => {
            actionManager.executeAction(actionToggleStats);
          }}
          renderCustomStats={renderCustomStats}
          setAppState={setAppState}
        />
      )}
      <div
        className="App-bottom-bar"
        style={{
          marginBottom: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN * 2,
          marginLeft: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN * 2,
          marginRight: SCROLLBAR_WIDTH + SCROLLBAR_MARGIN * 2
        }}
      >
        <Island padding={0}>
          {editorState.openMenu === "shape" &&
          !editorState.viewModeEnabled &&
          showSelectedShapeActions(editorState, layers) ? (
            <Section className="App-mobile-menu" heading="selectedShapeActions">
              <SelectedShapeActions
                editorState={editorState}
                layers={layers}
                renderAction={actionManager.renderAction}
              />
            </Section>
          ) : null}
          <footer className="App-toolbar">
            {renderAppToolbar()}
            {editorState.scrolledOutside &&
              !editorState.openMenu &&
              !editorState.openSidebar && (
                <button
                  className="scroll-back-to-content"
                  onClick={() => {
                    setAppState((editorState) => ({
                      ...calculateScrollCenter(layers, editorState, canvas)
                    }));
                  }}
                >
                  {t("buttons.scrollBackToContent")}
                </button>
              )}
          </footer>
        </Island>
      </div>
    </>
  );
};
