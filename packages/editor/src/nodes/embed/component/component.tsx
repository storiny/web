import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  NodeKey,
  NodeSelection,
  RangeSelection
} from "lexical";
import dynamic from "next/dynamic";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useIntersectionObserver } from "react-intersection-observer-hook";
import useResizeObserver from "use-resize-observer";

import Popover from "~/components/Popover";
import Spinner from "~/components/Spinner";
import Typography from "~/components/Typography";
import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { overflowingFiguresAtom } from "../../../atoms";
import figureStyles from "../../common/figure.module.scss";
import { $isEmbedNode, EmbedNodeLayout } from "../embed";
import styles from "./embed.module.scss";
import WebpageEmbed from "./webpage";
import { WebpageMetadata } from "./webpage/webpage.props";

const EmbedNodeControls = dynamic(() => import("./node-controls"), {
  loading: () => (
    <div className={"flex-center"} style={{ padding: "12px 24px" }}>
      <Spinner />
    </div>
  )
});

// Regex to match inlined json data
const DATA_REGEX =
  /<script type="application\/storiny\.embed\.(rich|photo)\+json">(.+)<\/script>/i;

/**
 * Returns the system color scheme
 */
const parseSystemTheme = (): "dark" | "light" => {
  if (
    window &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  return "dark";
};

const EmbedComponent = ({
  nodeKey,
  layout,
  url
}: {
  layout: EmbedNodeLayout;
  nodeKey: NodeKey;
  url: string;
}): React.ReactElement | null => {
  const theme = use_app_selector(select_theme);
  const [editor] = useLexicalComposerContext();
  const setOverflowingFigures = useSetAtom(overflowingFiguresAtom);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<boolean>(false);
  const [metadata, setMetadata] = React.useState<null | WebpageMetadata>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const supportsBinaryThemeRef = React.useRef<boolean>(false);
  const prevDataRef = React.useRef<{ theme: string; url: string }>({
    url: "",
    theme: ""
  });
  const [selected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = React.useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const { height: containerHeight, ref: resizeObserverRef } =
    useResizeObserver();
  const [intersectionObserverRef, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });
  useHotkeys(
    "backspace,delete",
    (event) => {
      if (selected && $isNodeSelection(selection)) {
        event.preventDefault();
        setSelected(false);

        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isEmbedNode(node)) {
            node.remove();
          }
        });
      }
    },
    { enableOnContentEditable: true }
  );
  const editable = editor.isEditable();
  const visible = Boolean(entry && entry.isIntersecting);

  /**
   * Generates the embed
   */
  const generateEmbed = React.useCallback(() => {
    const parsedTheme = theme === "system" ? parseSystemTheme() : theme;
    const embedUrl = `${process.env.NEXT_PUBLIC_DISCOVERY_URL}/embed/${url}?theme=${parsedTheme}`;

    fetch(embedUrl)
      .then(async (response) => {
        if (!response.ok) {
          setError(true);
          return;
        }

        if (!contentRef.current) {
          return;
        }

        try {
          const data = await response.clone().json();

          // Webpage metadata
          if (data.embed_type === "metadata") {
            setMetadata(data);

            supportsBinaryThemeRef.current = false;
            editor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if ($isEmbedNode(node)) {
                node.setLayout("fill"); // Reset layout
              }
            });
          } else {
            // Embed with script sourcse
            if (data.sources) {
              for (const source of data.sources) {
                const script = document.createElement("script");
                script.src = source;
                script.async = true;

                document.body.appendChild(script);
              }
            }

            if (data.html) {
              contentRef.current.innerHTML = data.html;
            }

            if (typeof data.supports_binary_theme !== "undefined") {
              supportsBinaryThemeRef.current = Boolean(
                data.supports_binary_theme
              );
            }
          }
        } catch {
          // Embeds with iframe
          try {
            const html = await response.clone().text();
            const dataMatch = html.match(DATA_REGEX);

            if (dataMatch?.length) {
              try {
                const embedData = JSON.parse(dataMatch[2]);
                const style =
                  embedData.height && embedData.width
                    ? `--padding-desktop:${(
                        (embedData.height / embedData.width) *
                        100
                      ).toFixed(2)}%`
                    : embedData.styles || "";

                contentRef.current.setAttribute("style", style);

                if (typeof embedData.supports_binary_theme !== "undefined") {
                  supportsBinaryThemeRef.current = Boolean(
                    embedData.supports_binary_theme
                  );
                }
              } catch {
                setError(true);
              }
            }

            contentRef.current.innerHTML = `
              <iframe
                loading="lazy"
                style="${Object.entries({
                  "color-scheme": parsedTheme,
                  border: "none",
                  outline: "none",
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  background: "var(--bg-body)"
                })
                  .map(([key, value]) => `${key}:${value}`)
                  .join(";")}" 
                src="${embedUrl}"></iframe>`;
          } catch {
            setError(true);
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [editor, nodeKey, theme, url]);

  React.useEffect(() => {
    if (
      url !== prevDataRef.current.url ||
      (theme !== prevDataRef.current.theme && supportsBinaryThemeRef.current)
    ) {
      setLoading(true);
      generateEmbed();
      prevDataRef.current = {
        url,
        theme
      };
    }
  }, [generateEmbed, url, theme]);

  React.useEffect(() => {
    let isMounted = true;

    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read($getSelection));
        }
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          if (
            event.target === containerRef.current ||
            containerRef.current?.contains(event.target as HTMLElement)
          ) {
            if (event.shiftKey) {
              setSelected(!selected);
            } else {
              clearSelection();
              setSelected(true);
            }

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    return () => {
      isMounted = false;
      unregister();
    };
  }, [clearSelection, editor, nodeKey, selected, setSelected]);

  React.useEffect(() => {
    setOverflowingFigures((prev) => {
      if (visible && layout === "overflow") {
        prev.add(nodeKey);
      } else {
        prev.delete(nodeKey);
      }

      return new Set(prev);
    });

    return () => {
      setOverflowingFigures((prev) => {
        prev.delete(nodeKey);
        return new Set(prev);
      });
    };
  }, [layout, nodeKey, setOverflowingFigures, visible]);

  React.useImperativeHandle(resizeObserverRef, () => containerRef.current!);

  return (
    <div className={styles.embed} ref={intersectionObserverRef}>
      <div
        className={clsx(
          styles.container,
          editable && styles.editable,
          selected && styles.selected,
          Boolean(metadata) && styles.metadata,
          // Grid for overflowing the embed
          ["grid", "dashboard", "no-sidenav"]
        )}
        data-layout={layout}
        data-testid={"embed-node"}
        ref={containerRef}
      >
        {layout === "overflow" && (
          <span
            aria-hidden
            className={figureStyles["left-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
        {metadata ? (
          <div
            className={clsx("flex-center", styles.content)}
            data-layout={layout}
          >
            <WebpageEmbed metadata={metadata} selected={selected} />
          </div>
        ) : (
          <Popover
            className={clsx(
              "flex-center",
              "flex-col",
              styles.x,
              styles.popover
            )}
            onOpenChange={(newOpen): void => {
              if (!newOpen) {
                setSelected(false);
              }
            }}
            open={editable && selected && $isNodeSelection(selection)}
            slot_props={{
              content: {
                collisionPadding: { top: 64 }, // Prevent header collision
                sideOffset: 12,
                side: "top"
              }
            }}
            trigger={
              error ? (
                <div
                  className={clsx("flex-center", styles.content, styles.error)}
                  data-layout={layout}
                  role={"button"}
                >
                  <Typography
                    className={clsx("t-center", "t-minor")}
                    level={"body2"}
                  >
                    Embed unavailable
                  </Typography>
                </div>
              ) : (
                <div
                  className={clsx("flex-center", styles.content)}
                  data-layout={layout}
                  data-loading={String(loading)}
                  ref={contentRef}
                  role={"button"}
                />
              )
            }
          >
            <EmbedNodeControls layout={layout} nodeKey={nodeKey} />
          </Popover>
        )}
        {layout === "overflow" && (
          <span
            aria-hidden
            className={figureStyles["right-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
      </div>
      {/* Compensate for the absolute position of the embed element */}
      <div
        aria-hidden
        style={{
          height: containerHeight
        }}
      />
    </div>
  );
};

export default EmbedComponent;
