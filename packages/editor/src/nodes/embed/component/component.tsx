import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection as use_lexical_node_selection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as merge_register } from "@lexical/utils";
import { clsx } from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import {
  $getNodeByKey as $get_node_by_key,
  $getSelection as $get_selection,
  $isNodeSelection as $is_node_selection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  NodeKey
} from "lexical";
import dynamic from "next/dynamic";
import React from "react";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";
import { useIntersectionObserver as use_intersection_observer } from "react-intersection-observer-hook";
import use_resize_observer from "use-resize-observer";

import Popover from "~/components/popover";
import Spinner from "~/components/spinner";
import Typography from "~/components/typography";
import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import { overflowing_figures_atom } from "../../../atoms";
import figure_styles from "../../common/figure.module.scss";
import { $is_embed_node, EmbedNodeLayout } from "../embed";
import styles from "./embed.module.scss";
import WebpageEmbed from "./webpage";
import { WebpageMetadata } from "./webpage/webpage.props";

const EmbedNodeControls = dynamic(() => import("./node-controls"), {
  loading: () => (
    <div className={css["flex-center"]} style={{ padding: "12px 24px" }}>
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
const parse_system_theme = (): "dark" | "light" => {
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
  node_key,
  layout,
  url
}: {
  layout: EmbedNodeLayout;
  node_key: NodeKey;
  url: string;
}): React.ReactElement | null => {
  const theme = use_app_selector(select_theme);
  const [editor] = use_lexical_composer_context();
  const set_overflowing_figures = use_set_atom(overflowing_figures_atom);
  const [loading, set_loading] = React.useState<boolean>(true);
  const [error, set_error] = React.useState<boolean>(false);
  const [metadata, set_metadata] = React.useState<null | WebpageMetadata>(null);
  const container_ref = React.useRef<HTMLDivElement | null>(null);
  const content_ref = React.useRef<HTMLDivElement | null>(null);
  const supports_binary_theme_ref = React.useRef<boolean>(false);
  const prev_data_ref = React.useRef<{ theme: string; url: string }>({
    url: "",
    theme: ""
  });
  const [selected, set_selected, clear_selection] =
    use_lexical_node_selection(node_key);
  const [selection, set_selection] = React.useState<BaseSelection | null>(null);
  const { height: container_height, ref: resize_observer_ref } =
    use_resize_observer();
  const [intersection_observer_ref, { entry }] = use_intersection_observer({
    rootMargin: "-52px 0px 0px 0px"
  });

  use_hot_keys(
    "backspace,delete",
    (event) => {
      if (selected && $is_node_selection(selection)) {
        event.preventDefault();
        set_selected(false);

        editor.update(() => {
          const node = $get_node_by_key(node_key);
          if ($is_embed_node(node)) {
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
  const generate_embed = React.useCallback(() => {
    const parsed_theme = theme === "system" ? parse_system_theme() : theme;
    const embed_url = `${process.env.NEXT_PUBLIC_DISCOVERY_URL}/embed/${url}?theme=${parsed_theme}`;

    fetch(embed_url)
      .then(async (response) => {
        if (!response.ok) {
          set_error(true);
          return;
        }

        if (!content_ref.current) {
          return;
        }

        try {
          const data = await response.clone().json();

          // Webpage metadata
          if (data.embed_type === "metadata") {
            set_metadata(data);
            supports_binary_theme_ref.current = false;

            editor.update(() => {
              const node = $get_node_by_key(node_key);
              if ($is_embed_node(node)) {
                node.set_layout("fill"); // Reset layout
              }
            });
          } else {
            // Embed with script sourcse
            if (data.sources) {
              for (const source of data.sources) {
                const nonce = document
                  .querySelector('meta[name="csp-nonce"]')
                  ?.getAttribute?.("content");
                const script = document.createElement("script");

                script.src = source;
                script.async = true;
                script.nonce = nonce ?? undefined;
                document.body.appendChild(script);
              }
            }

            if (data.html) {
              content_ref.current.innerHTML = data.html;
            }

            if (typeof data.supports_binary_theme !== "undefined") {
              supports_binary_theme_ref.current = Boolean(
                data.supports_binary_theme
              );
            }
          }
        } catch {
          // Embeds with iframe
          try {
            const html = await response.clone().text();
            const data_match = html.match(DATA_REGEX);

            if (data_match?.length) {
              try {
                const embed_data = JSON.parse(data_match[2]);
                const style =
                  embed_data.height && embed_data.width
                    ? `--padding-desktop:${(
                        (embed_data.height / embed_data.width) *
                        100
                      ).toFixed(2)}%`
                    : embed_data.styles || "";

                content_ref.current.setAttribute("style", style);

                if (typeof embed_data.supports_binary_theme !== "undefined") {
                  supports_binary_theme_ref.current = Boolean(
                    embed_data.supports_binary_theme
                  );
                }
              } catch {
                set_error(true);
              }
            }

            content_ref.current.innerHTML = `
              <iframe
                loading="lazy"
                style="${Object.entries({
                  "color-scheme": parsed_theme,
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
                src="${embed_url}"></iframe>`;
          } catch {
            set_error(true);
          }
        }
      })
      .catch(() => set_error(true))
      .finally(() => set_loading(false));
  }, [editor, node_key, theme, url]);

  React.useEffect(() => {
    if (
      url !== prev_data_ref.current.url ||
      (theme !== prev_data_ref.current.theme &&
        supports_binary_theme_ref.current)
    ) {
      set_loading(true);
      generate_embed();
      prev_data_ref.current = {
        url,
        theme
      };
    }
  }, [generate_embed, url, theme]);

  React.useEffect(() => {
    let is_mounted = true;

    const unregister = merge_register(
      editor.registerUpdateListener(({ editorState: editor_state }) => {
        if (is_mounted) {
          set_selection(editor_state.read($get_selection));
        }
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          if (
            event.target === container_ref.current ||
            container_ref.current?.contains(event.target as HTMLElement)
          ) {
            if (event.shiftKey) {
              set_selected(!selected);
            } else {
              clear_selection();
              set_selected(true);
            }

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    return () => {
      is_mounted = false;
      unregister();
    };
  }, [clear_selection, editor, node_key, selected, set_selected]);

  React.useEffect(() => {
    set_overflowing_figures((prev) => {
      if (visible && layout === "overflow") {
        prev.add(node_key);
      } else {
        prev.delete(node_key);
      }

      return new Set(prev);
    });

    return () => {
      set_overflowing_figures((prev) => {
        prev.delete(node_key);
        return new Set(prev);
      });
    };
  }, [layout, node_key, set_overflowing_figures, visible]);

  React.useImperativeHandle(resize_observer_ref, () => container_ref.current!);

  return (
    <div className={styles.embed} ref={intersection_observer_ref}>
      <div
        className={clsx(
          styles.container,
          editable && styles.editable,
          selected && styles.selected,
          Boolean(metadata) && styles.metadata,
          // Grid for overflowing the embed
          [css["grid"], css["dashboard"], css["no-sidenav"]]
        )}
        data-layout={layout}
        data-testid={"embed-node"}
        ref={container_ref}
      >
        {layout === "overflow" && (
          <span
            aria-hidden
            className={figure_styles["left-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
        {metadata ? (
          <div
            className={clsx(css["flex-center"], styles.content)}
            data-layout={layout}
          >
            <WebpageEmbed metadata={metadata} selected={selected} />
          </div>
        ) : (
          <Popover
            className={clsx(
              css["flex-center"],
              css["flex-col"],
              styles.x,
              styles.popover
            )}
            onOpenChange={(next_open: boolean): void => {
              if (!next_open) {
                set_selected(false);
              }
            }}
            open={editable && selected && $is_node_selection(selection)}
            slot_props={{
              content: {
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                collisionPadding: { top: 64 }, // Prevent header collision
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                sideOffset: 12,
                side: "top"
              }
            }}
            trigger={
              error ? (
                <div
                  className={clsx(
                    css["flex-center"],
                    styles.content,
                    styles.error
                  )}
                  data-layout={layout}
                  role={"button"}
                >
                  <Typography
                    className={clsx(css["t-center"], css["t-minor"])}
                    level={"body2"}
                  >
                    Embed unavailable
                  </Typography>
                </div>
              ) : (
                <div
                  className={clsx(css["flex-center"], styles.content)}
                  data-layout={layout}
                  data-loading={String(loading)}
                  ref={content_ref}
                  role={"button"}
                />
              )
            }
          >
            <EmbedNodeControls layout={layout} node_key={node_key} />
          </Popover>
        )}
        {layout === "overflow" && (
          <span
            aria-hidden
            className={figure_styles["right-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
      </div>
      {/* Compensate for the absolute position of the embed element */}
      <div
        aria-hidden
        style={{
          height: container_height
        }}
      />
    </div>
  );
};

export default EmbedComponent;
