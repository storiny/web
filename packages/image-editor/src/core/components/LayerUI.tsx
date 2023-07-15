import "./LayerUI.scss";
import "./Toolbar.scss";

import clsx from "clsx";
import { Provider, useAtom, useAtomValue } from "jotai";
import React from "react";

import { calculateScrollCenter } from "../../lib/scene";
import { actionToggleStats } from "../actions/actionToggleStats";
import { ActionManager } from "../actions/manager";
import { trackEvent } from "../analytics";
import { isHandToolActive } from "../appState";
import { useDevice } from "../components/App";
import { CLASSES, DEFAULT_SIDEBAR, LIBRARY_SIDEBAR_WIDTH } from "../constants";
import { TunnelsContext, useInitializeTunnels } from "../context/tunnels";
import { UIAppStateContext } from "../context/ui-appState";
import { Language, t } from "../i18n";
import { jotaiScope } from "../jotai";
import { isTextLayer, showSelectedShapeActions } from "../layer";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import {
  AppClassProperties,
  AppProps,
  AppState,
  BinaryFiles,
  ExcalidrawProps,
  UIAppState
} from "../types";
import { capitalizeString, isShallowEqual } from "../utils";
import { SelectedShapeActions, ShapesSwitcher } from "./Actions";
import { ActiveConfirmDialog } from "./ActiveConfirmDialog";
import { DefaultSidebar } from "./DefaultSidebar";
import { ErrorDialog } from "./ErrorDialog";
import { activeEyeDropperAtom, EyeDropper } from "./EyeDropper";
import { FixedSideContainer } from "./FixedSideContainer";
import Footer from "./footer/Footer";
import { HandButton } from "./HandButton";
import { HelpDialog } from "./HelpDialog";
import { HintViewer } from "./HintViewer";
import { LibraryIcon } from "./icons";
import { ImageExportDialog } from "./ImageExportDialog";
import { Island } from "./Island";
import { JSONExportDialog } from "./JSONExportDialog";
import { LoadingMessage } from "./LoadingMessage";
import { LockButton } from "./LockButton";
import MainMenu from "./main-menu/MainMenu";
import { MobileMenu } from "./MobileMenu";
import { OverwriteConfirmDialog } from "./OverwriteConfirm/OverwriteConfirm";
import { PasteChartDialog } from "./PasteChartDialog";
import { PenModeButton } from "./PenModeButton";
import { Section } from "./Section";
import { isSidebarDockedAtom } from "./Sidebar/Sidebar";
import Stack from "./Stack";
import { Stats } from "./Stats";
import { UserList } from "./UserList";

interface LayerUIProps {
  UIOptions: AppProps["UIOptions"];
  actionManager: ActionManager;
  appState: UIAppState;
  canvas: HTMLCanvasLayer | null;
  children?: React.ReactNode;
  files: BinaryFiles;
  langCode: Language["code"];
  layers: readonly NonDeletedExcalidrawLayer[];
  onExportImage: AppClassProperties["onExportImage"];
  onHandToolToggle: () => void;
  onImageAction: (data: { insertOnCanvasDirectly: boolean }) => void;
  onLockToggle: () => void;
  onPenModeToggle: () => void;
  renderCustomStats?: ExcalidrawProps["renderCustomStats"];
  renderTopRightUI?: ExcalidrawProps["renderTopRightUI"];
  renderWelcomeScreen: boolean;
  setAppState: React.Component<any, AppState>["setState"];
  showExitZenModeBtn: boolean;
}

const DefaultMainMenu: React.FC<{
  UIOptions: AppProps["UIOptions"];
}> = ({ UIOptions }) => (
  <MainMenu __fallback>
    <MainMenu.DefaultItems.LoadScene />
    <MainMenu.DefaultItems.SaveToActiveFile />
    {/* FIXME we should to test for this inside the item itself */}
    {UIOptions.canvasActions.export && <MainMenu.DefaultItems.Export />}
    {/* FIXME we should to test for this inside the item itself */}
    {UIOptions.canvasActions.saveAsImage && (
      <MainMenu.DefaultItems.SaveAsImage />
    )}
    <MainMenu.DefaultItems.Help />
    <MainMenu.DefaultItems.ClearCanvas />
    <MainMenu.Separator />
    <MainMenu.Group title="Excalidraw links">
      <MainMenu.DefaultItems.Socials />
    </MainMenu.Group>
    <MainMenu.Separator />
    <MainMenu.DefaultItems.ToggleTheme />
    <MainMenu.DefaultItems.ChangeCanvasBackground />
  </MainMenu>
);

const DefaultOverwriteConfirmDialog = () => (
  <OverwriteConfirmDialog __fallback>
    <OverwriteConfirmDialog.Actions.SaveToDisk />
    <OverwriteConfirmDialog.Actions.ExportToImage />
  </OverwriteConfirmDialog>
);

const LayerUI = ({
  actionManager,
  appState,
  files,
  setAppState,
  layers,
  canvas,
  onLockToggle,
  onHandToolToggle,
  onPenModeToggle,
  showExitZenModeBtn,
  renderTopRightUI,
  renderCustomStats,
  UIOptions,
  onImageAction,
  onExportImage,
  renderWelcomeScreen,
  children
}: LayerUIProps) => {
  const device = useDevice();
  const tunnels = useInitializeTunnels();

  const [eyeDropperState, setEyeDropperState] = useAtom(
    activeEyeDropperAtom,
    jotaiScope
  );

  const renderJSONExportDialog = () => {
    if (!UIOptions.canvasActions.export) {
      return null;
    }

    return (
      <JSONExportDialog
        actionManager={actionManager}
        appState={appState}
        canvas={canvas}
        exportOpts={UIOptions.canvasActions.export}
        files={files}
        layers={layers}
        setAppState={setAppState}
      />
    );
  };

  const renderImageExportDialog = () => {
    if (!UIOptions.canvasActions.saveAsImage) {
      return null;
    }

    return (
      <ImageExportDialog
        actionManager={actionManager}
        appState={appState}
        files={files}
        layers={layers}
        onCloseRequest={() => setAppState({ openDialog: null })}
        onExportImage={onExportImage}
      />
    );
  };

  const renderCanvasActions = () => (
    <div style={{ position: "relative" }}>
      {/* wrapping to Fragment stops React from occasionally complaining
                about identical Keys */}
      <tunnels.MainMenuTunnel.Out />
      {renderWelcomeScreen && <tunnels.WelcomeScreenMenuHintTunnel.Out />}
    </div>
  );

  const renderSelectedShapeActions = () => (
    <Section
      className={clsx("selected-shape-actions zen-mode-transition", {
        "transition-left": appState.zenModeEnabled
      })}
      heading="selectedShapeActions"
    >
      <Island
        className={CLASSES.SHAPE_ACTIONS_MENU}
        padding={2}
        style={{
          // we want to make sure this doesn't overflow so subtracting the
          // approximate height of hamburgerMenu + footer
          maxHeight: `${appState.height - 166}px`
        }}
      >
        <SelectedShapeActions
          appState={appState}
          layers={layers}
          renderAction={actionManager.renderAction}
        />
      </Island>
    </Section>
  );

  const renderFixedSideContainer = () => {
    const shouldRenderSelectedShapeActions = showSelectedShapeActions(
      appState,
      layers
    );

    return (
      <FixedSideContainer side="top">
        <div className="App-menu App-menu_top">
          <Stack.Col className={clsx("App-menu_top__left")} gap={6}>
            {renderCanvasActions()}
            {shouldRenderSelectedShapeActions && renderSelectedShapeActions()}
          </Stack.Col>
          {!appState.viewModeEnabled && (
            <Section className="shapes-section" heading="shapes">
              {(heading: React.ReactNode) => (
                <div style={{ position: "relative" }}>
                  {renderWelcomeScreen && (
                    <tunnels.WelcomeScreenToolbarHintTunnel.Out />
                  )}
                  <Stack.Col align="start" gap={4}>
                    <Stack.Row
                      className={clsx("App-toolbar-container", {
                        "zen-mode": appState.zenModeEnabled
                      })}
                      gap={1}
                    >
                      <Island
                        className={clsx("App-toolbar", {
                          "zen-mode": appState.zenModeEnabled
                        })}
                        padding={1}
                      >
                        <HintViewer
                          appState={appState}
                          device={device}
                          isMobile={device.isMobile}
                          layers={layers}
                        />
                        {heading}
                        <Stack.Row gap={1}>
                          <PenModeButton
                            checked={appState.penMode}
                            onChange={onPenModeToggle}
                            penDetected={appState.penDetected}
                            title={t("toolBar.penMode")}
                            zenModeEnabled={appState.zenModeEnabled}
                          />
                          <LockButton
                            checked={appState.activeTool.locked}
                            onChange={onLockToggle}
                            title={t("toolBar.lock")}
                          />

                          <div className="App-toolbar__divider" />

                          <HandButton
                            checked={isHandToolActive(appState)}
                            isMobile
                            onChange={() => onHandToolToggle()}
                            title={t("toolBar.hand")}
                          />

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
                    </Stack.Row>
                  </Stack.Col>
                </div>
              )}
            </Section>
          )}
          <div
            className={clsx(
              "layer-ui__wrapper__top-right zen-mode-transition",
              {
                "transition-right": appState.zenModeEnabled
              }
            )}
          >
            <UserList collaborators={appState.collaborators} />
            {renderTopRightUI?.(device.isMobile, appState)}
            {!appState.viewModeEnabled &&
              // hide button when sidebar docked
              (!isSidebarDocked ||
                appState.openSidebar?.name !== DEFAULT_SIDEBAR.name) && (
                <tunnels.DefaultSidebarTriggerTunnel.Out />
              )}
          </div>
        </div>
      </FixedSideContainer>
    );
  };

  const renderSidebars = () => (
    <DefaultSidebar
      __fallback
      onDock={(docked) => {
        trackEvent(
          "sidebar",
          `toggleDock (${docked ? "dock" : "undock"})`,
          `(${device.isMobile ? "mobile" : "desktop"})`
        );
      }}
    />
  );

  const isSidebarDocked = useAtomValue(isSidebarDockedAtom, jotaiScope);

  const layerUIJSX = (
    <>
      {/* ------------------------- tunneled UI ---------------------------- */}
      {/* make sure we render host app components first so that we can detect
          them first on initial render to optimize layout shift */}
      {children}
      {/* render component fallbacks. Can be rendered anywhere as they'll be
          tunneled away. We only render tunneled components that actually
        have defaults when host do not render anything. */}
      <DefaultMainMenu UIOptions={UIOptions} />
      <DefaultSidebar.Trigger
        __fallback
        icon={LibraryIcon}
        onToggle={(open) => {
          if (open) {
            trackEvent(
              "sidebar",
              `${DEFAULT_SIDEBAR.name} (open)`,
              `button (${device.isMobile ? "mobile" : "desktop"})`
            );
          }
        }}
        tab={DEFAULT_SIDEBAR.defaultTab}
        title={capitalizeString(t("toolBar.library"))}
      >
        {t("toolBar.library")}
      </DefaultSidebar.Trigger>
      <DefaultOverwriteConfirmDialog />
      {/* ------------------------------------------------------------------ */}

      {appState.isLoading && <LoadingMessage delay={250} />}
      {appState.errorMessage && (
        <ErrorDialog onClose={() => setAppState({ errorMessage: null })}>
          {appState.errorMessage}
        </ErrorDialog>
      )}
      {eyeDropperState && !device.isMobile && (
        <EyeDropper
          onCancel={() => {
            setEyeDropperState(null);
          }}
          onSelect={(color, event) => {
            setEyeDropperState((state) =>
              state?.keepOpenOnAlt && event.altKey ? state : null
            );
            eyeDropperState?.onSelect?.(color, event);
          }}
          previewType={eyeDropperState.previewType}
          swapPreviewOnAlt={eyeDropperState.swapPreviewOnAlt}
        />
      )}
      {appState.openDialog === "help" && (
        <HelpDialog
          onClose={() => {
            setAppState({ openDialog: null });
          }}
        />
      )}
      <ActiveConfirmDialog />
      <tunnels.OverwriteConfirmDialogTunnel.Out />
      {renderImageExportDialog()}
      {renderJSONExportDialog()}
      {appState.pasteDialog.shown && (
        <PasteChartDialog
          appState={appState}
          onClose={() =>
            setAppState({
              pasteDialog: { shown: false, data: null }
            })
          }
          setAppState={setAppState}
        />
      )}
      {device.isMobile && (
        <MobileMenu
          actionManager={actionManager}
          appState={appState}
          canvas={canvas}
          device={device}
          layers={layers}
          onHandToolToggle={onHandToolToggle}
          onImageAction={onImageAction}
          onLockToggle={onLockToggle}
          onPenModeToggle={onPenModeToggle}
          renderCustomStats={renderCustomStats}
          renderImageExportDialog={renderImageExportDialog}
          renderJSONExportDialog={renderJSONExportDialog}
          renderSidebars={renderSidebars}
          renderTopRightUI={renderTopRightUI}
          renderWelcomeScreen={renderWelcomeScreen}
          setAppState={setAppState}
        />
      )}
      {!device.isMobile && (
        <>
          <div
            className={clsx("layer-ui__wrapper", {
              "disable-pointerEvents":
                appState.draggingLayer ||
                appState.resizingLayer ||
                (appState.editingLayer && !isTextLayer(appState.editingLayer))
            })}
            style={
              appState.openSidebar &&
              isSidebarDocked &&
              device.canDeviceFitSidebar
                ? { width: `calc(100% - ${LIBRARY_SIDEBAR_WIDTH}px)` }
                : {}
            }
          >
            {renderWelcomeScreen && <tunnels.WelcomeScreenCenterTunnel.Out />}
            {renderFixedSideContainer()}
            <Footer
              actionManager={actionManager}
              appState={appState}
              renderWelcomeScreen={renderWelcomeScreen}
              showExitZenModeBtn={showExitZenModeBtn}
            />
            {appState.showStats && (
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
            {appState.scrolledOutside && (
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
          </div>
          {renderSidebars()}
        </>
      )}
    </>
  );

  return (
    <UIAppStateContext.Provider value={appState}>
      <Provider scope={tunnels.jotaiScope}>
        <TunnelsContext.Provider value={tunnels}>
          {layerUIJSX}
        </TunnelsContext.Provider>
      </Provider>
    </UIAppStateContext.Provider>
  );
};

const stripIrrelevantAppStateProps = (appState: AppState): UIAppState => {
  const {
    suggestedBindings,
    startBoundLayer,
    cursorButton,
    scrollX,
    scrollY,
    ...ret
  } = appState;
  return ret;
};

const areEqual = (prevProps: LayerUIProps, nextProps: LayerUIProps) => {
  // short-circuit early
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  const { canvas: _prevCanvas, appState: prevAppState, ...prev } = prevProps;
  const { canvas: _nextCanvas, appState: nextAppState, ...next } = nextProps;

  return (
    isShallowEqual(
      // asserting AppState because we're being passed the whole AppState
      // but resolve to only the UI-relevant props
      stripIrrelevantAppStateProps(prevAppState as AppState),
      stripIrrelevantAppStateProps(nextAppState as AppState),
      {
        selectedLayerIds: isShallowEqual,
        selectedGroupIds: isShallowEqual
      }
    ) && isShallowEqual(prev, next)
  );
};

export default React.memo(LayerUI, areEqual);
