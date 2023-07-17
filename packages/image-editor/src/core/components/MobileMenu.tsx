import React from "react";

import { calculateScrollCenter } from "../../lib/scene";
import {
  SCROLLBAR_MARGIN,
  SCROLLBAR_WIDTH
} from "../../lib/scene/scrollbars/scrollbars";
import { actionToggleStats } from "../actions";
import { ActionManager } from "../actions/manager";
import { isHandToolActive } from "../appState";
import { useTunnels } from "../context/tunnels";
import { t } from "../i18n";
import { showSelectedShapeActions } from "../layer";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { AppState, Device, ExcalidrawProps, UIAppState } from "../types";
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
  appState: UIAppState;
  canvas: HTMLCanvasLayer | null;
  device: Device;
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
    appState: UIAppState
  ) => JSX.Layer | null;
  renderWelcomeScreen: boolean;
  setAppState: React.Component<any, AppState>["setState"];
};

export const MobileMenu = ({
  appState,
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
                    activeTool={appState.activeTool}
                    appState={appState}
                    canvas={canvas}
                    onImageAction={({ pointerType }) => {
                      onImageAction({
                        insertOnCanvasDirectly: pointerType !== "mouse"
                      });
                    }}
                    setAppState={setAppState}
                  />
                </Stack.Row>
              </Island>
              {renderTopRightUI && renderTopRightUI(true, appState)}
              <div className="mobile-misc-tools-container">
                {!appState.viewModeEnabled && (
                  <DefaultSidebarTriggerTunnel.Out />
                )}
                <PenModeButton
                  checked={appState.penMode}
                  isMobile
                  onChange={onPenModeToggle}
                  penDetected={appState.penDetected}
                  title={t("toolBar.penMode")}
                />
                <LockButton
                  checked={appState.activeTool.locked}
                  isMobile
                  onChange={onLockToggle}
                  title={t("toolBar.lock")}
                />
                <HandButton
                  checked={isHandToolActive(appState)}
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
        appState={appState}
        device={device}
        isMobile={true}
        layers={layers}
      />
    </FixedSideContainer>
  );

  const renderAppToolbar = () => {
    if (appState.viewModeEnabled) {
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
          appState.multiLayer ? "finalize" : "duplicateSelection"
        )}
        {actionManager.renderAction("deleteSelectedLayers")}
      </div>
    );
  };

  return (
    <>
      {renderSidebars()}
      {!appState.viewModeEnabled && renderToolbar()}
      {!appState.openMenu && appState.showStats && (
        <Stats
          appState={appState}
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
          {appState.openMenu === "shape" &&
          !appState.viewModeEnabled &&
          showSelectedShapeActions(appState, layers) ? (
            <Section className="App-mobile-menu" heading="selectedShapeActions">
              <SelectedShapeActions
                appState={appState}
                layers={layers}
                renderAction={actionManager.renderAction}
              />
            </Section>
          ) : null}
          <footer className="App-toolbar">
            {renderAppToolbar()}
            {appState.scrolledOutside &&
              !appState.openMenu &&
              !appState.openSidebar && (
                <button
                  className="scroll-back-to-content"
                  onClick={() => {
                    setAppState((appState) => ({
                      ...calculateScrollCenter(layers, appState, canvas)
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
