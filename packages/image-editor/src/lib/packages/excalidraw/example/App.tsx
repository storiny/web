import "./App.scss";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";

import { EVENT, ROUNDNESS } from "../../../../core/constants";
import { KEYS } from "../../../../core/keys";
import { NonDeletedExcalidrawLayer } from "../../../../core/layer/types";
import { distance2d } from "../../../../core/math";
import {
  AppState,
  BinaryFileData,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  Gesture,
  LibraryItems,
  PointerDownState as ExcalidrawPointerDownState
} from "../../../../core/types";
import {
  ResolvablePromise,
  resolvablePromise,
  withBatchedUpdates,
  withBatchedUpdatesThrottled
} from "../../../../core/utils";
import { fileOpen } from "../../../data/fs/filesystem";
import { ImportedLibraryData } from "../../../data/types";
import { loadSceneOrLibraryFromBlob } from "../../utils";
import type * as TExcalidraw from "../index";
import CustomFooter from "./CustomFooter";
import initialData from "./initialData";
import MobileFooter from "./MobileFooter";
import ExampleSidebar from "./sidebar/ExampleSidebar";

declare global {
  interface Window {
    ExcalidrawLib: typeof TExcalidraw;
  }
}

type Comment = {
  id?: string;
  value: string;
  x: number;
  y: number;
};

type PointerDownState = {
  hitLayer: Comment;
  hitLayerOffsets: {
    x: number;
    y: number;
  };
  onMove: any;
  onUp: any;
  x: number;
  y: number;
};

// This is so that we use the bundled excalidraw.development.js file instead
// of the actual source code
const {
  exportToCanvas,
  exportToSvg,
  exportToBlob,
  exportToClipboard,
  Excalidraw,
  useHandleLibrary,
  MIME_TYPES,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
  restoreLayers,
  Sidebar,
  Footer,
  WelcomeScreen,
  MainMenu,
  LiveCollaborationTrigger
} = window.ExcalidrawLib;

const COMMENT_ICON_DIMENSION = 32;
const COMMENT_INPUT_HEIGHT = 50;
const COMMENT_INPUT_WIDTH = 150;

export interface AppProps {
  appTitle: string;
  customArgs?: any[];
  useCustom: (api: ExcalidrawImperativeAPI | null, customArgs?: any[]) => void;
}

export default ({ appTitle, useCustom, customArgs }: AppProps) => {
  const appRef = useRef<any>(null);
  const [viewModeEnabled, setViewModeEnabled] = useState(false);
  const [zenModeEnabled, setZenModeEnabled] = useState(false);
  const [gridModeEnabled, setGridModeEnabled] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [canvasUrl, setCanvasUrl] = useState<string>("");
  const [exportWithDarkMode, setExportWithDarkMode] = useState(false);
  const [exportEmbedScene, setExportEmbedScene] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [commentIcons, setCommentIcons] = useState<{ [id: string]: Comment }>(
    {}
  );
  const [comment, setComment] = useState<Comment | null>(null);

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  useCustom(excalidrawAPI, customArgs);

  useHandleLibrary({ excalidrawAPI });

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const fetchData = async () => {
      const res = await fetch("/images/rocket.jpeg");
      const imageData = await res.blob();
      const reader = new FileReader();
      reader.readAsDataURL(imageData);

      reader.onload = () => {
        const imagesArray: BinaryFileData[] = [
          {
            id: "rocket" as BinaryFileData["id"],
            dataURL: reader.result as BinaryFileData["dataURL"],
            mimeType: MIME_TYPES.jpg,
            created: 1644915140367,
            lastRetrieved: 1644915140367
          }
        ];

        //@ts-ignore
        initialStatePromiseRef.current.promise.resolve(initialData);
        excalidrawAPI.addFiles(imagesArray);
      };
    };
    fetchData();
  }, [excalidrawAPI]);

  const renderTopRightUI = (isMobile: boolean) => (
    <>
      {!isMobile && (
        <LiveCollaborationTrigger
          isCollaborating={isCollaborating}
          onSelect={() => {
            window.alert("Collab dialog clicked");
          }}
        />
      )}
      <button
        onClick={() => alert("This is an empty top right UI")}
        style={{ height: "2.5rem" }}
      >
        Click me
      </button>
    </>
  );

  const loadSceneOrLibrary = async () => {
    const file = await fileOpen({ description: "Excalidraw or library file" });
    const contents = await loadSceneOrLibraryFromBlob(file, null, null);
    if (contents.type === MIME_TYPES.excalidraw) {
      excalidrawAPI?.updateScene(contents.data as any);
    } else if (contents.type === MIME_TYPES.excalidrawlib) {
      excalidrawAPI?.updateLibrary({
        libraryItems: (contents.data as ImportedLibraryData).libraryItems!,
        openLibraryMenu: true
      });
    }
  };

  const updateScene = () => {
    const sceneData = {
      layers: restoreLayers(
        [
          {
            type: "rectangle",
            version: 141,
            versionNonce: 361174001,
            isDeleted: false,
            id: "oDVXy8D6rom3H1-LLH2-f",
            fillStyle: "hachure",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            angle: 0,
            x: 100.50390625,
            y: 93.67578125,
            strokeColor: "#c92a2a",
            backgroundColor: "transparent",
            width: 186.47265625,
            height: 141.9765625,
            seed: 1968410350,
            groupIds: [],
            frameId: null,
            boundLayers: null,
            locked: false,
            link: null,
            updated: 1,
            roundness: {
              type: ROUNDNESS.ADAPTIVE_RADIUS,
              value: 32
            }
          }
        ],
        null
      ),
      appState: {
        viewBackgroundColor: "#edf2ff"
      }
    };
    excalidrawAPI?.updateScene(sceneData);
  };

  const onLinkOpen = useCallback(
    (
      layer: NonDeletedExcalidrawLayer,
      event: CustomEvent<{
        nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasLayer>;
      }>
    ) => {
      const link = layer.link!;
      const { nativeEvent } = event.detail;
      const isNewTab = nativeEvent.ctrlKey || nativeEvent.metaKey;
      const isNewWindow = nativeEvent.shiftKey;
      const isInternalLink =
        link.startsWith("/") || link.includes(window.location.origin);
      if (isInternalLink && !isNewTab && !isNewWindow) {
        // signal that we're handling the redirect ourselves
        event.preventDefault();
        // do a custom redirect, such as passing to react-router
        // ...
      }
    },
    []
  );

  const onCopy = async (type: "png" | "svg" | "json") => {
    if (!excalidrawAPI) {
      return false;
    }
    await exportToClipboard({
      layers: excalidrawAPI.getSceneLayers(),
      appState: excalidrawAPI.getAppState(),
      files: excalidrawAPI.getFiles(),
      type
    });
    window.alert(`Copied to clipboard as ${type} successfully`);
  };

  const [pointerData, setPointerData] = useState<{
    button: "down" | "up";
    pointer: { x: number; y: number };
    pointersMap: Gesture["pointers"];
  } | null>(null);

  const onPointerDown = (
    activeTool: AppState["activeTool"],
    pointerDownState: ExcalidrawPointerDownState
  ) => {
    if (activeTool.type === "custom" && activeTool.customType === "comment") {
      const { x, y } = pointerDownState.origin;
      setComment({ x, y, value: "" });
    }
  };

  const rerenderCommentIcons = () => {
    if (!excalidrawAPI) {
      return false;
    }
    const commentIconsLayers = appRef.current.querySelectorAll(
      ".comment-icon"
    ) as HTMLLayer[];
    commentIconsLayers.forEach((ele) => {
      const id = ele.id;
      const appstate = excalidrawAPI.getAppState();
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: commentIcons[id].x, sceneY: commentIcons[id].y },
        appstate
      );
      ele.style.left = `${
        x - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetLeft
      }px`;
      ele.style.top = `${
        y - COMMENT_ICON_DIMENSION / 2 - appstate!.offsetTop
      }px`;
    });
  };

  const onPointerMoveFromPointerDownHandler = (
    pointerDownState: PointerDownState
  ) =>
    withBatchedUpdatesThrottled((event) => {
      if (!excalidrawAPI) {
        return false;
      }
      const { x, y } = viewportCoordsToSceneCoords(
        {
          clientX: event.clientX - pointerDownState.hitLayerOffsets.x,
          clientY: event.clientY - pointerDownState.hitLayerOffsets.y
        },
        excalidrawAPI.getAppState()
      );
      setCommentIcons({
        ...commentIcons,
        [pointerDownState.hitLayer.id!]: {
          ...commentIcons[pointerDownState.hitLayer.id!],
          x,
          y
        }
      });
    });
  const onPointerUpFromPointerDownHandler = (
    pointerDownState: PointerDownState
  ) =>
    withBatchedUpdates((event) => {
      window.removeEventListener(EVENT.POINTER_MOVE, pointerDownState.onMove);
      window.removeEventListener(EVENT.POINTER_UP, pointerDownState.onUp);
      excalidrawAPI?.setActiveTool({ type: "selection" });
      const distance = distance2d(
        pointerDownState.x,
        pointerDownState.y,
        event.clientX,
        event.clientY
      );
      if (distance === 0) {
        if (!comment) {
          setComment({
            x: pointerDownState.hitLayer.x + 60,
            y: pointerDownState.hitLayer.y,
            value: pointerDownState.hitLayer.value,
            id: pointerDownState.hitLayer.id
          });
        } else {
          setComment(null);
        }
      }
    });

  const renderCommentIcons = () =>
    Object.values(commentIcons).map((commentIcon) => {
      if (!excalidrawAPI) {
        return false;
      }
      const appState = excalidrawAPI.getAppState();
      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: commentIcon.x, sceneY: commentIcon.y },
        excalidrawAPI.getAppState()
      );
      return (
        <div
          className="comment-icon"
          id={commentIcon.id}
          key={commentIcon.id}
          onPointerDown={(event) => {
            event.preventDefault();
            if (comment) {
              commentIcon.value = comment.value;
              saveComment();
            }
            const pointerDownState: any = {
              x: event.clientX,
              y: event.clientY,
              hitLayer: commentIcon,
              hitLayerOffsets: { x: event.clientX - x, y: event.clientY - y }
            };
            const onPointerMove =
              onPointerMoveFromPointerDownHandler(pointerDownState);
            const onPointerUp =
              onPointerUpFromPointerDownHandler(pointerDownState);
            window.addEventListener(EVENT.POINTER_MOVE, onPointerMove);
            window.addEventListener(EVENT.POINTER_UP, onPointerUp);

            pointerDownState.onMove = onPointerMove;
            pointerDownState.onUp = onPointerUp;

            excalidrawAPI?.setActiveTool({
              type: "custom",
              customType: "comment"
            });
          }}
          style={{
            top: `${y - COMMENT_ICON_DIMENSION / 2 - appState!.offsetTop}px`,
            left: `${x - COMMENT_ICON_DIMENSION / 2 - appState!.offsetLeft}px`,
            position: "absolute",
            zIndex: 1,
            width: `${COMMENT_ICON_DIMENSION}px`,
            height: `${COMMENT_ICON_DIMENSION}px`,
            cursor: "pointer",
            touchAction: "none"
          }}
        >
          <div className="comment-avatar">
            <img alt="doremon" src="images/doremon.png" />
          </div>
        </div>
      );
    });

  const saveComment = () => {
    if (!comment) {
      return;
    }
    if (!comment.id && !comment.value) {
      setComment(null);
      return;
    }
    const id = comment.id || nanoid();
    setCommentIcons({
      ...commentIcons,
      [id]: {
        x: comment.id ? comment.x - 60 : comment.x,
        y: comment.y,
        id,
        value: comment.value
      }
    });
    setComment(null);
  };

  const renderComment = () => {
    if (!comment) {
      return null;
    }
    const appState = excalidrawAPI?.getAppState()!;
    const { x, y } = sceneCoordsToViewportCoords(
      { sceneX: comment.x, sceneY: comment.y },
      appState
    );
    let top = y - COMMENT_ICON_DIMENSION / 2 - appState.offsetTop;
    let left = x - COMMENT_ICON_DIMENSION / 2 - appState.offsetLeft;

    if (
      top + COMMENT_INPUT_HEIGHT <
      appState.offsetTop + COMMENT_INPUT_HEIGHT
    ) {
      top = COMMENT_ICON_DIMENSION / 2;
    }
    if (top + COMMENT_INPUT_HEIGHT > appState.height) {
      top = appState.height - COMMENT_INPUT_HEIGHT - COMMENT_ICON_DIMENSION / 2;
    }
    if (
      left + COMMENT_INPUT_WIDTH <
      appState.offsetLeft + COMMENT_INPUT_WIDTH
    ) {
      left = COMMENT_ICON_DIMENSION / 2;
    }
    if (left + COMMENT_INPUT_WIDTH > appState.width) {
      left = appState.width - COMMENT_INPUT_WIDTH - COMMENT_ICON_DIMENSION / 2;
    }

    return (
      <textarea
        className="comment"
        onBlur={saveComment}
        onChange={(event) => {
          setComment({ ...comment, value: event.target.value });
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === KEYS.ENTER) {
            event.preventDefault();
            saveComment();
          }
        }}
        placeholder={comment.value ? "Reply" : "Comment"}
        ref={(ref) => {
          setTimeout(() => ref?.focus());
        }}
        style={{
          top: `${top}px`,
          left: `${left}px`,
          position: "absolute",
          zIndex: 1,
          height: `${COMMENT_INPUT_HEIGHT}px`,
          width: `${COMMENT_INPUT_WIDTH}px`
        }}
        value={comment.value}
      />
    );
  };

  const renderMenu = () => (
    <MainMenu>
      <MainMenu.DefaultItems.SaveAsImage />
      <MainMenu.DefaultItems.Export />
      <MainMenu.Separator />
      <MainMenu.DefaultItems.LiveCollaborationTrigger
        isCollaborating={isCollaborating}
        onSelect={() => window.alert("You clicked on collab button")}
      />
      <MainMenu.Group title="Excalidraw links">
        <MainMenu.DefaultItems.Socials />
      </MainMenu.Group>
      <MainMenu.Separator />
      <MainMenu.ItemCustom>
        <button
          onClick={() => window.alert("custom menu item")}
          style={{ height: "2rem" }}
        >
          custom item
        </button>
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.Help />

      {excalidrawAPI && <MobileFooter excalidrawAPI={excalidrawAPI} />}
    </MainMenu>
  );

  return (
    <div className="App" ref={appRef}>
      <h1>{appTitle}</h1>
      {/* TODO fix type */}
      <ExampleSidebar>
        <div className="button-wrapper">
          <button onClick={loadSceneOrLibrary}>Load Scene or Library</button>
          <button className="update-scene" onClick={updateScene}>
            Update Scene
          </button>
          <button
            className="reset-scene"
            onClick={() => {
              excalidrawAPI?.resetScene();
            }}
          >
            Reset Scene
          </button>
          <button
            onClick={() => {
              const libraryItems: LibraryItems = [
                {
                  status: "published",
                  id: "1",
                  created: 1,
                  layers: initialData.libraryItems[1] as any
                },
                {
                  status: "unpublished",
                  id: "2",
                  created: 2,
                  layers: initialData.libraryItems[1] as any
                }
              ];
              excalidrawAPI?.updateLibrary({
                libraryItems
              });
            }}
          >
            Update Library
          </button>

          <label>
            <input
              checked={viewModeEnabled}
              onChange={() => setViewModeEnabled(!viewModeEnabled)}
              type="checkbox"
            />
            View mode
          </label>
          <label>
            <input
              checked={zenModeEnabled}
              onChange={() => setZenModeEnabled(!zenModeEnabled)}
              type="checkbox"
            />
            Zen mode
          </label>
          <label>
            <input
              checked={gridModeEnabled}
              onChange={() => setGridModeEnabled(!gridModeEnabled)}
              type="checkbox"
            />
            Grid mode
          </label>
          <label>
            <input
              checked={theme === "dark"}
              onChange={() => {
                let newTheme = "light";
                if (theme === "light") {
                  newTheme = "dark";
                }
                setTheme(newTheme);
              }}
              type="checkbox"
            />
            Switch to Dark Theme
          </label>
          <label>
            <input
              checked={isCollaborating}
              onChange={() => {
                if (!isCollaborating) {
                  const collaborators = new Map();
                  collaborators.set("id1", {
                    username: "Doremon",
                    avatarUrl: "images/doremon.png"
                  });
                  collaborators.set("id2", {
                    username: "Excalibot",
                    avatarUrl: "images/excalibot.png"
                  });
                  collaborators.set("id3", {
                    username: "Pika",
                    avatarUrl: "images/pika.jpeg"
                  });
                  collaborators.set("id4", {
                    username: "fallback",
                    avatarUrl: "https://example.com"
                  });
                  excalidrawAPI?.updateScene({ collaborators });
                } else {
                  excalidrawAPI?.updateScene({
                    collaborators: new Map()
                  });
                }
                setIsCollaborating(!isCollaborating);
              }}
              type="checkbox"
            />
            Show collaborators
          </label>
          <div>
            <button onClick={onCopy.bind(null, "png")}>
              Copy to Clipboard as PNG
            </button>
            <button onClick={onCopy.bind(null, "svg")}>
              Copy to Clipboard as SVG
            </button>
            <button onClick={onCopy.bind(null, "json")}>
              Copy to Clipboard as JSON
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1em",
              justifyContent: "center",
              marginTop: "1em"
            }}
          >
            <div>x: {pointerData?.pointer.x ?? 0}</div>
            <div>y: {pointerData?.pointer.y ?? 0}</div>
          </div>
        </div>
        <div className="excalidraw-wrapper">
          <Excalidraw
            UIOptions={{ canvasActions: { loadScene: false } }}
            gridModeEnabled={gridModeEnabled}
            initialData={initialStatePromiseRef.current.promise}
            name="Custom name of drawing"
            onChange={(layers, state) => {
              console.info("Layers :", layers, "State : ", state);
            }}
            onLinkOpen={onLinkOpen}
            onPointerDown={onPointerDown}
            onPointerUpdate={(payload: {
              button: "down" | "up";
              pointer: { x: number; y: number };
              pointersMap: Gesture["pointers"];
            }) => setPointerData(payload)}
            onScrollChange={rerenderCommentIcons}
            ref={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
            renderTopRightUI={renderTopRightUI}
            theme={theme}
            viewModeEnabled={viewModeEnabled}
            zenModeEnabled={zenModeEnabled}
          >
            {excalidrawAPI && (
              <Footer>
                <CustomFooter excalidrawAPI={excalidrawAPI} />
              </Footer>
            )}
            <WelcomeScreen />
            <Sidebar name="custom">
              <Sidebar.Tabs>
                <Sidebar.Header />
                <Sidebar.Tab tab="one">Tab one!</Sidebar.Tab>
                <Sidebar.Tab tab="two">Tab two!</Sidebar.Tab>
                <Sidebar.TabTriggers>
                  <Sidebar.TabTrigger tab="one">One</Sidebar.TabTrigger>
                  <Sidebar.TabTrigger tab="two">Two</Sidebar.TabTrigger>
                </Sidebar.TabTriggers>
              </Sidebar.Tabs>
            </Sidebar>
            <Sidebar.Trigger
              name="custom"
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "20px",
                zIndex: 9999999999999999
              }}
              tab="one"
            >
              Toggle Custom Sidebar
            </Sidebar.Trigger>
            {renderMenu()}
          </Excalidraw>
          {Object.keys(commentIcons || []).length > 0 && renderCommentIcons()}
          {comment && renderComment()}
        </div>

        <div className="export-wrapper button-wrapper">
          <label className="export-wrapper__checkbox">
            <input
              checked={exportWithDarkMode}
              onChange={() => setExportWithDarkMode(!exportWithDarkMode)}
              type="checkbox"
            />
            Export with dark mode
          </label>
          <label className="export-wrapper__checkbox">
            <input
              checked={exportEmbedScene}
              onChange={() => setExportEmbedScene(!exportEmbedScene)}
              type="checkbox"
            />
            Export with embed scene
          </label>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const svg = await exportToSvg({
                layers: excalidrawAPI?.getSceneLayers(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode,
                  exportEmbedScene,
                  width: 300,
                  height: 100
                },
                files: excalidrawAPI?.getFiles()
              });
              appRef.current.querySelector(".export-svg").innerHTML =
                svg.outerHTML;
            }}
          >
            Export to SVG
          </button>
          <div className="export export-svg"></div>

          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const blob = await exportToBlob({
                layers: excalidrawAPI?.getSceneLayers(),
                mimeType: "image/png",
                appState: {
                  ...initialData.appState,
                  exportEmbedScene,
                  exportWithDarkMode
                },
                files: excalidrawAPI?.getFiles()
              });
              setBlobUrl(window.URL.createObjectURL(blob));
            }}
          >
            Export to Blob
          </button>
          <div className="export export-blob">
            <img alt="" src={blobUrl} />
          </div>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const canvas = await exportToCanvas({
                layers: excalidrawAPI.getSceneLayers(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode
                },
                files: excalidrawAPI.getFiles()
              });
              const ctx = canvas.getContext("2d")!;
              ctx.font = "30px Virgil";
              ctx.strokeText("My custom text", 50, 60);
              setCanvasUrl(canvas.toDataURL());
            }}
          >
            Export to Canvas
          </button>
          <button
            onClick={async () => {
              if (!excalidrawAPI) {
                return;
              }
              const canvas = await exportToCanvas({
                layers: excalidrawAPI.getSceneLayers(),
                appState: {
                  ...initialData.appState,
                  exportWithDarkMode
                },
                files: excalidrawAPI.getFiles()
              });
              const ctx = canvas.getContext("2d")!;
              ctx.font = "30px Virgil";
              ctx.strokeText("My custom text", 50, 60);
              setCanvasUrl(canvas.toDataURL());
            }}
          >
            Export to Canvas
          </button>
          <button
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const layers = excalidrawAPI.getSceneLayers();
              excalidrawAPI.scrollToContent(layers[0], {
                fitToViewport: true
              });
            }}
            type="button"
          >
            Fit to viewport, first layer
          </button>
          <button
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const layers = excalidrawAPI.getSceneLayers();
              excalidrawAPI.scrollToContent(layers[0], {
                fitToContent: true
              });

              excalidrawAPI.scrollToContent(layers[0], {
                fitToContent: true
              });
            }}
            type="button"
          >
            Fit to content, first layer
          </button>
          <button
            onClick={() => {
              if (!excalidrawAPI) {
                return;
              }

              const layers = excalidrawAPI.getSceneLayers();
              excalidrawAPI.scrollToContent(layers[0], {
                fitToContent: true
              });

              excalidrawAPI.scrollToContent(layers[0]);
            }}
            type="button"
          >
            Scroll to first layer, no fitToContent, no fitToViewport
          </button>
          <div className="export export-canvas">
            <img alt="" src={canvasUrl} />
          </div>
        </div>
      </ExampleSidebar>
    </div>
  );
};
