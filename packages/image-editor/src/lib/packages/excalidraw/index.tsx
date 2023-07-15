import "../../../core/css/app.scss";
import "../../../core/css/styles.scss";

import { Provider } from "jotai";
import React, { forwardRef, useEffect } from "react";

import App from "../../../core/components/App";
import Footer from "../../../core/components/footer/FooterCenter";
import { InitializeApp } from "../../../core/components/InitializeApp";
import LiveCollaborationTrigger from "../../../core/components/live-collaboration/LiveCollaborationTrigger";
import MainMenu from "../../../core/components/main-menu/MainMenu";
import WelcomeScreen from "../../../core/components/welcome-screen/WelcomeScreen";
import { DEFAULT_UI_OPTIONS } from "../../../core/constants";
import { defaultLang } from "../../../core/i18n";
import { jotaiScope, jotaiStore } from "../../../core/jotai";
import {
  AppProps,
  ExcalidrawAPIRefValue,
  ExcalidrawProps
} from "../../../core/types";
import { isShallowEqual } from "../../../core/utils";

const ExcalidrawBase = (props: ExcalidrawProps) => {
  const {
    onChange,
    initialData,
    excalidrawRef,
    isCollaborating = false,
    onPointerUpdate,
    renderTopRightUI,
    langCode = defaultLang.code,
    viewModeEnabled,
    zenModeEnabled,
    gridModeEnabled,
    libraryReturnUrl,
    theme,
    name,
    renderCustomStats,
    onPaste,
    detectScroll = true,
    handleKeyboardGlobally = false,
    onLibraryChange,
    autoFocus = false,
    generateIdForFile,
    onLinkOpen,
    onPointerDown,
    onScrollChange,
    children
  } = props;

  const canvasActions = props.UIOptions?.canvasActions;

  // FIXME normalize/set defaults in parent component so that the memo resolver
  // compares the same values
  const UIOptions: AppProps["UIOptions"] = {
    ...props.UIOptions,
    canvasActions: {
      ...DEFAULT_UI_OPTIONS.canvasActions,
      ...canvasActions
    }
  };

  if (canvasActions?.export) {
    UIOptions.canvasActions.export.saveFileToDisk =
      canvasActions.export?.saveFileToDisk ??
      DEFAULT_UI_OPTIONS.canvasActions.export.saveFileToDisk;
  }

  if (
    UIOptions.canvasActions.toggleTheme === null &&
    typeof theme === "undefined"
  ) {
    UIOptions.canvasActions.toggleTheme = true;
  }

  useEffect(() => {
    // Block pinch-zooming on iOS outside of the content area
    const handleTouchMove = (event: TouchEvent) => {
      // @ts-ignore
      if (typeof event.scale === "number" && event.scale !== 1) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false
    });

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <Provider scope={jotaiScope} unstable_createStore={() => jotaiStore}>
      <InitializeApp langCode={langCode} theme={theme}>
        <App
          UIOptions={UIOptions}
          autoFocus={autoFocus}
          detectScroll={detectScroll}
          excalidrawRef={excalidrawRef}
          generateIdForFile={generateIdForFile}
          gridModeEnabled={gridModeEnabled}
          handleKeyboardGlobally={handleKeyboardGlobally}
          initialData={initialData}
          isCollaborating={isCollaborating}
          langCode={langCode}
          libraryReturnUrl={libraryReturnUrl}
          name={name}
          onChange={onChange}
          onLibraryChange={onLibraryChange}
          onLinkOpen={onLinkOpen}
          onPaste={onPaste}
          onPointerDown={onPointerDown}
          onPointerUpdate={onPointerUpdate}
          onScrollChange={onScrollChange}
          renderCustomStats={renderCustomStats}
          renderTopRightUI={renderTopRightUI}
          theme={theme}
          viewModeEnabled={viewModeEnabled}
          zenModeEnabled={zenModeEnabled}
        >
          {children}
        </App>
      </InitializeApp>
    </Provider>
  );
};

type PublicExcalidrawProps = Omit<ExcalidrawProps, "forwardedRef">;

const areEqual = (
  prevProps: PublicExcalidrawProps,
  nextProps: PublicExcalidrawProps
) => {
  // short-circuit early
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  const {
    initialData: prevInitialData,
    UIOptions: prevUIOptions = {},
    ...prev
  } = prevProps;
  const {
    initialData: nextInitialData,
    UIOptions: nextUIOptions = {},
    ...next
  } = nextProps;

  // comparing UIOptions
  const prevUIOptionsKeys = Object.keys(prevUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];
  const nextUIOptionsKeys = Object.keys(nextUIOptions) as (keyof Partial<
    typeof DEFAULT_UI_OPTIONS
  >)[];

  if (prevUIOptionsKeys.length !== nextUIOptionsKeys.length) {
    return false;
  }

  const isUIOptionsSame = prevUIOptionsKeys.every((key) => {
    if (key === "canvasActions") {
      const canvasOptionKeys = Object.keys(
        prevUIOptions.canvasActions!
      ) as (keyof Partial<typeof DEFAULT_UI_OPTIONS.canvasActions>)[];
      return canvasOptionKeys.every((key) => {
        if (
          key === "export" &&
          prevUIOptions?.canvasActions?.export &&
          nextUIOptions?.canvasActions?.export
        ) {
          return (
            prevUIOptions.canvasActions.export.saveFileToDisk ===
            nextUIOptions.canvasActions.export.saveFileToDisk
          );
        }
        return (
          prevUIOptions?.canvasActions?.[key] ===
          nextUIOptions?.canvasActions?.[key]
        );
      });
    }
    return prevUIOptions[key] === nextUIOptions[key];
  });

  return isUIOptionsSame && isShallowEqual(prev, next);
};

const forwardedRefComp = forwardRef<
  ExcalidrawAPIRefValue,
  PublicExcalidrawProps
>((props, ref) => <ExcalidrawBase {...props} excalidrawRef={ref} />);

export const Excalidraw = React.memo(forwardedRefComp, areEqual);
Excalidraw.displayName = "Excalidraw";

export { Button } from "../../../core/components/Button";
export { Sidebar } from "../../../core/components/Sidebar/Sidebar";
export { FONT_FAMILY, MIME_TYPES, THEME } from "../../../core/constants";
export { defaultLang, languages, useI18n } from "../../../core/i18n";
export {
  getNonDeletedLayers,
  getSceneVersion,
  isInvisiblySmallLayer
} from "../../../core/layer";
export {
  bumpVersion,
  mutateLayer,
  newLayerWith
} from "../../../core/layer/mutateLayer";
export { isLinearLayer } from "../../../core/layer/typeChecks";
export {
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords
} from "../../../core/utils";
export {
  parseLibraryTokensFromUrl,
  useHandleLibrary
} from "../../data/library";
export {
  restore,
  restoreAppState,
  restoreLayers,
  restoreLibraryItems
} from "../../data/restore/restore";
export {
  exportToBlob,
  exportToCanvas,
  exportToClipboard,
  exportToSvg,
  getFreeDrawSvgPath,
  loadFromBlob,
  loadLibraryFromBlob,
  loadSceneOrLibraryFromBlob,
  mergeLibraryItems,
  serializeAsJSON,
  serializeLibraryAsJSON
} from "../utils";
export { Footer };
export { MainMenu };
export { useDevice } from "../../../core/components/App";
export { WelcomeScreen };
export { LiveCollaborationTrigger };

export { DefaultSidebar } from "../../../core/components/DefaultSidebar";
export { normalizeLink } from "../../data/url/url";
