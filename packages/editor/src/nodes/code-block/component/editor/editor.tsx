"use client";

import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { use_blog_context } from "@storiny/web/src/app/blog/[slug]/context";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import { $getNodeByKey as $get_node_by_key, NodeKey } from "lexical";
import React from "react";
import use_resize_observer from "use-resize-observer";
import { Text as YText } from "yjs";

import Divider from "~/components/divider";
import Option from "~/components/option";
import Select from "~/components/select";
import Spinner from "~/components/spinner";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import TerminalIcon from "~/icons/terminal";
import WarningIcon from "~/icons/warning";
import { select_resolved_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import {
  awareness_atom,
  story_metadata_atom,
  undo_manager_atom
} from "../../../../atoms";
import { $is_code_block_node } from "../../code-block";
import CopyCodeAction from "./components/copy-code-action";
import CodeBlockTitle from "./components/title";
import WrapLinesAction from "./components/wrap-lines-action";
import styles from "./editor.module.scss";
import { common_extensions } from "./extensions/common";
import { gutter_extensions } from "./extensions/gutter";
import { CODE_BLOCK_LANGUAGE_MAP, get_language_support } from "./languages";
import { CODE_BLOCK_DARK_THEME } from "./themes/dark";
import { CODE_BLOCK_LIGHT_THEME } from "./themes/light";

const CodeBlockEditor = ({
  node_key,
  content,
  language,
  title
}: {
  content: YText;
  language: string | null;
  node_key: NodeKey;
  title: string;
}): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const code_block_id = React.useId();
  const undo_manager = use_atom_value(undo_manager_atom);
  const awareness = use_atom_value(awareness_atom);
  const story = use_atom_value(story_metadata_atom);
  const theme = use_app_selector(select_resolved_theme);
  const enable_code_gutters = use_app_selector(
    (state) => state.preferences.enable_code_gutters
  );
  const { height: container_height, ref: resize_observer_ref } =
    use_resize_observer();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [view, set_view] = React.useState<EditorView | null>(null);
  const mounted_ref = React.useRef<boolean>(false);
  const is_reader = story.role === "reader";
  const is_viewer = story.role === "viewer";
  const [loading, set_loading] = React.useState<boolean>(editor.isEditable());
  const [language_status, set_language_status] = React.useState<
    "loading" | "loaded" | "error"
  >(language === null ? "loaded" : "loading");
  const blog = use_blog_context();
  const language_compartment = React.useMemo(() => new Compartment(), []);
  const wrap_compartment = React.useMemo(() => new Compartment(), []);
  const theme_compartment = React.useMemo(() => new Compartment(), []);
  const gutter_compartment = React.useMemo(() => new Compartment(), []);

  /**
   * Updates the code block language
   * @param next_language The next language
   */
  const update_language = React.useCallback(
    (next_language: string) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);

        if ($is_code_block_node(node)) {
          node.set_language(next_language === "none" ? null : next_language);
        }
      });
    },
    [editor, node_key]
  );

  /**
   * Makes the main editor editable.
   * @param should_focus Whether to focus the editor
   */
  const make_editor_editable = React.useCallback(
    (should_focus?: boolean) => {
      editor.setEditable(true);

      if (should_focus) {
        const content_editable = document.querySelector(
          "div[data-editor-content]"
        ) as HTMLDivElement | null;

        setTimeout(() => {
          if (content_editable) {
            editor.focus();
            content_editable.focus();
          }
        }, 10);
      }
    },
    [editor]
  );

  /**
   * Destroys the code editor
   */
  const destroy_editor = React.useCallback(() => {
    if (view !== null && mounted_ref.current) {
      view.destroy();
    }
  }, [view]);

  // Listen for theme changes
  React.useEffect(() => {
    if (view !== null) {
      view.dispatch({
        effects: theme_compartment.reconfigure(
          (theme === "light" ? CODE_BLOCK_LIGHT_THEME : CODE_BLOCK_DARK_THEME)(
            is_reader || is_viewer
          )
        )
      });
    }
  }, [is_reader, is_viewer, theme, theme_compartment, view]);

  // Listen for code gutter preference changes
  React.useEffect(() => {
    if (view !== null) {
      view.dispatch({
        effects: gutter_compartment.reconfigure(
          enable_code_gutters ? gutter_extensions : []
        )
      });
    }
  }, [enable_code_gutters, gutter_compartment, view]);

  // Dynamically load the language support.
  React.useEffect(() => {
    if (view !== null) {
      if (language !== null) {
        if (!(language in CODE_BLOCK_LANGUAGE_MAP)) {
          set_language_status("loaded");
          return update_language("none");
        }

        set_language_status("loading");

        get_language_support(language as keyof typeof CODE_BLOCK_LANGUAGE_MAP)
          .then((support) => {
            set_language_status("loaded");

            if (support) {
              view.dispatch({
                effects: language_compartment.reconfigure(support)
              });
            }
          })
          .catch(() => {
            set_language_status("error");
          });
      } else {
        view.dispatch({
          effects: language_compartment.reconfigure([])
        });
      }
    }
  }, [language, language_compartment, update_language, view]);

  React.useEffect(() => {
    if (mounted_ref.current) {
      return;
    }

    mounted_ref.current = true;
    destroy_editor();

    const extensions: Extension[] = [
      ...common_extensions,
      gutter_compartment.of(enable_code_gutters ? gutter_extensions : []),
      theme_compartment.of(
        (theme === "light" ? CODE_BLOCK_LIGHT_THEME : CODE_BLOCK_DARK_THEME)(
          is_reader || is_viewer
        )
      ),
      language_compartment.of([]),
      wrap_compartment.of([])
    ];

    const read_only_extensions: Extension[] = [
      EditorState.readOnly.of(true),
      EditorView.editable.of(false)
    ];

    if (is_reader) {
      extensions.push(...read_only_extensions);

      set_view(
        new EditorView({
          parent: ref.current as HTMLDivElement,
          state: EditorState.create({
            doc: content.toString(),
            extensions
          })
        })
      );
    } else {
      (async (): Promise<void> => {
        set_loading(true);

        const { get_editable_extensions } = await import(
          "./extensions/editable"
        );
        const editable_extensions = get_editable_extensions({
          content,
          editor,
          node_key,
          awareness,
          undo_manager,
          make_editor_editable
        });

        extensions.push(...editable_extensions);

        if (is_viewer) {
          extensions.push(...read_only_extensions);
        } else {
          extensions.push(
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.focusChanged) {
                if (update.view.hasFocus) {
                  editor.setEditable(false);

                  if (awareness) {
                    const local_state = awareness.getLocalState();

                    if (local_state) {
                      local_state.focusing = true;
                      awareness.setLocalState(local_state);
                    }
                  }
                } else if (
                  !document.activeElement ||
                  // Check if the focus jumped from one code block to
                  // another
                  (document.activeElement &&
                    !document.activeElement.classList.contains("cm-content") &&
                    !document.activeElement.classList.contains("cm-scroller"))
                ) {
                  // Reset the selection
                  update.view.dispatch({ selection: { anchor: 0 } });

                  // Only focus if the active element is not present inside
                  // the code block.
                  make_editor_editable(
                    !document
                      .getElementById(code_block_id)
                      ?.contains?.(document.activeElement)
                  );
                }
              }
            })
          );
        }

        set_view(
          new EditorView({
            parent: ref.current as HTMLDivElement,
            state: EditorState.create({
              doc: content.toString(),
              extensions
            })
          })
        );

        set_loading(false);
      })();
    }

    return destroy_editor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    code_block_id,
    awareness,
    content,
    destroy_editor,
    editor,
    make_editor_editable,
    node_key,
    undo_manager,
    theme_compartment,
    wrap_compartment,
    language_compartment,
    gutter_compartment,
    is_reader,
    is_viewer
  ]);

  return (
    <div className={styles["code-block"]} id={code_block_id}>
      <div
        className={clsx(
          styles.container,
          css["grid"],
          css["dashboard"],
          css["no-sidenav"]
        )}
        data-language={language || "none"}
        data-status={loading ? "loading" : "loaded"}
        data-testid={"code-block-node"}
        ref={resize_observer_ref}
      >
        <div
          className={clsx(
            css["flex-col"],
            styles.content,
            blog?.is_story_minimal_layout && styles["is-blog"]
          )}
        >
          <div className={clsx(css["flex-center"], styles.header)}>
            <div className={clsx(css.flex, styles.info)}>
              <span className={clsx(css["flex-center"], styles.icon)}>
                {is_reader ? (
                  language_status === "loading" ? (
                    <Spinner size={"sm"} />
                  ) : language_status === "error" ? (
                    <Tooltip content={"Unable to fetch the syntax highlighter"}>
                      <WarningIcon />
                    </Tooltip>
                  ) : (
                    <TerminalIcon />
                  )
                ) : (
                  <TerminalIcon />
                )}
              </span>
              <CodeBlockTitle
                node_key={node_key}
                read_only={is_reader || is_viewer}
                title={title}
              />
            </div>
            <div className={clsx(css["flex-center"], styles.actions)}>
              {is_reader || is_viewer ? (
                language === null ||
                !(language in CODE_BLOCK_LANGUAGE_MAP) ? null : (
                  <>
                    <Typography
                      className={clsx(css["flex-center"], styles.language)}
                      color={"minor"}
                      level={"body2"}
                    >
                      {
                        CODE_BLOCK_LANGUAGE_MAP[
                          language as keyof typeof CODE_BLOCK_LANGUAGE_MAP
                        ]
                      }
                    </Typography>
                    <Divider orientation={"vertical"} />
                  </>
                )
              ) : (
                <>
                  <Select
                    onValueChange={update_language}
                    render_trigger={(trigger): React.ReactElement => (
                      <div
                        className={clsx(
                          css["flex-center"],
                          styles["language-select"],
                          language_status !== "loaded" &&
                            styles[language_status]
                        )}
                      >
                        {language_status === "loading" ? (
                          <Spinner size={"sm"} />
                        ) : language_status === "error" ? (
                          <WarningIcon />
                        ) : null}
                        {trigger}
                      </div>
                    )}
                    slot_props={{
                      trigger: {
                        className: clsx(styles.x, styles.select),
                        "aria-label": "Change code block language"
                      },
                      value: {
                        placeholder: "Language"
                      }
                    }}
                    value={language || "none"}
                  >
                    <Option value={"none"}>None</Option>
                    {Object.entries(CODE_BLOCK_LANGUAGE_MAP).map(
                      ([key, value]) => (
                        <Option key={key} value={key}>
                          {value}
                        </Option>
                      )
                    )}
                  </Select>
                  <Divider orientation={"vertical"} />
                </>
              )}
              <WrapLinesAction
                view={view}
                wrap_compartment={wrap_compartment}
              />
              <CopyCodeAction view={view} />
            </div>
          </div>
          <div className={styles.editor} ref={ref} />
          {loading && (
            <div
              aria-hidden={"true"}
              className={clsx(
                css["flex-center"],
                css["full-w"],
                styles.skeleton
              )}
            >
              <Spinner />
            </div>
          )}
        </div>
      </div>
      {/* Compensate for the absolute position of the editor element */}
      <div
        aria-hidden
        style={{
          height: container_height
        }}
      />
    </div>
  );
};

export default CodeBlockEditor;
