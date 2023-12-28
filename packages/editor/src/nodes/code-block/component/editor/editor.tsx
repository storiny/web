"use client";

import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import { $getNodeByKey as $get_node_by_key, NodeKey } from "lexical";
import React from "react";
import use_resize_observer from "use-resize-observer";
import { Text as YText } from "yjs";

import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Option from "~/components/option";
import Select from "~/components/select";
import Typography from "~/components/typography";
import CopyIcon from "~/icons/copy";
import SettingsIcon from "~/icons/settings";
import TerminalIcon from "~/icons/terminal";
import TextWrapIcon from "~/icons/text-wrap";
import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";

import { awareness_atom, undo_manager_atom } from "../../../../atoms";
import { $is_code_block_node } from "../../code-block";
import styles from "./editor.module.scss";
import { common_extensions } from "./extensions/common";
import { CODE_BLOCK_LANGUAGE_MAP, get_language_support } from "./languages";
import { CODE_BLOCK_DARK_THEME } from "./themes/dark";
import { CODE_BLOCK_LIGHT_THEME } from "./themes/light";

const CodeBlockEditor = ({
  node_key,
  content,
  language
}: {
  content: YText;
  language: string | null;
  node_key: NodeKey;
}): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const undo_manager = use_atom_value(undo_manager_atom);
  const awareness = use_atom_value(awareness_atom);
  const theme = use_app_selector(select_theme);
  const { height: container_height, ref: resize_observer_ref } =
    use_resize_observer();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const view_ref = React.useRef<EditorView | null>(null);
  const mounted_ref = React.useRef<boolean>(false);
  const read_only_ref = React.useRef<boolean>(!editor.isEditable());
  const language_compartment = React.useMemo(() => new Compartment(), []);
  const wrap_compartment = React.useMemo(() => new Compartment(), []);
  const theme_compartment = React.useMemo(() => new Compartment(), []);

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

      const view = view_ref.current;

      if (view && next_language !== "none") {
        // setLangLoading(true);
        // setError(false);

        get_language_support(
          next_language as keyof typeof CODE_BLOCK_LANGUAGE_MAP
        )
          .then((support) => {
            // setParser(newLang);

            if (support) {
              view.dispatch({
                effects: language_compartment.reconfigure(support)
              });
            }
          })
          .catch(() => {
            // setError(true);
            // toast.danger("Unable to load the language");
          });
        // .finally(() => setLangLoading(false));
      }
    },
    [editor, language_compartment, node_key]
  );

  // const handle_wrap = React.useCallback(() => {
  //   if (viewRef.current) {
  //     viewRef.current!.dispatch({
  //       effects: wrapCompartment.reconfigure(
  //         wrap ? [] : EditorView.lineWrapping
  //       )
  //     });
  //   }
  //
  //   toggleWrap();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [wrap_compartment, wrap]);

  // const handle_copy = React.useCallback(async () => {
  //   if (viewRef.current) {
  //     try {
  //       setCopying(true);
  //       const content = viewRef.current!.state.doc.toString() || "";
  //       await copyToClipboard(content);
  //       setCopyStatus("success", false);
  //     } catch (e) {
  //       setCopyStatus("error", false);
  //     } finally {
  //       setCopying(false);
  //       setCopyStatus(null);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  /**
   * Focuses the main editor
   */
  const focus_editor = React.useCallback(() => {
    const content_editable = document.querySelector(
      "div[data-editor-content]"
    ) as HTMLDivElement | null;

    editor.setEditable(true);

    setTimeout(() => {
      if (content_editable) {
        editor.focus();
        content_editable.focus();
      }
    }, 10);
  }, [editor]);

  /**
   * Destroys the code editor
   */
  const destroy_editor = React.useCallback(() => {
    if (view_ref.current) {
      view_ref.current?.destroy();
    }
  }, []);

  // Listen for theme changes
  React.useEffect(() => {
    const view = view_ref.current;

    if (view) {
      view.dispatch({
        effects: theme_compartment.reconfigure(
          theme === "light" ? CODE_BLOCK_LIGHT_THEME : CODE_BLOCK_DARK_THEME
        )
      });
    }
  }, [theme, theme_compartment]);

  React.useEffect(() => {
    if (mounted_ref.current) {
      return;
    }

    mounted_ref.current = true;
    destroy_editor();

    (async (): Promise<void> => {
      const extensions: Extension[] = [
        ...common_extensions,
        theme_compartment.of(
          theme === "light" ? CODE_BLOCK_LIGHT_THEME : CODE_BLOCK_DARK_THEME
        ),
        wrap_compartment.of([])
      ];

      // Dynamically load the language support.
      if (language !== null) {
        const language_support = await get_language_support(
          language as keyof typeof CODE_BLOCK_LANGUAGE_MAP
        );

        if (language_support) {
          extensions.push(language_compartment.of(language_support));
        }
      }

      if (read_only_ref.current) {
        extensions.push(
          ...[EditorState.readOnly.of(true), EditorView.editable.of(false)]
        );
      } else {
        const { get_editable_extensions } = await import(
          "./extensions/editable"
        );
        const editable_extensions = get_editable_extensions({
          content,
          editor,
          node_key,
          awareness,
          undo_manager,
          focus_editor
        });

        extensions.push(
          ...[
            ...editable_extensions,
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
                  // Check if the focus jumped from one code block to another
                  (document.activeElement &&
                    !document.activeElement.classList.contains("cm-content"))
                ) {
                  // Reset the selection
                  update.view.dispatch({ selection: { anchor: 0 } });
                  focus_editor();
                }
              }
            })
          ]
        );
      }

      view_ref.current = new EditorView({
        parent: ref.current as HTMLDivElement,
        state: EditorState.create({
          doc: content.toString(),
          extensions
        })
      });

      // initializeLineHighlights(viewRef.current!, data.highlightedLines);
      // setLangLoading(false);
      // setLoading(false);
    })();

    return destroy_editor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    awareness,
    content,
    destroy_editor,
    editor,
    focus_editor,
    node_key,
    undo_manager,
    theme_compartment,
    wrap_compartment,
    language_compartment
  ]);

  return (
    <div className={styles["code-block"]}>
      <div
        className={clsx(
          styles.container,
          // Grid for overflowing the embed
          css["grid"],
          css["dashboard"],
          css["no-sidenav"]
        )}
        data-testid={"code-block-node"}
        ref={resize_observer_ref}
      >
        <div className={clsx(css["flex-col"], styles.content)}>
          <div className={clsx(css["flex-center"], styles.header)}>
            <div className={clsx(css.flex, styles.info)}>
              <span className={clsx(css["flex-center"], styles.icon)}>
                <TerminalIcon />
              </span>
              <Typography
                className={clsx(styles.x, styles.title)}
                color={"minor"}
              >
                Block title
              </Typography>
            </div>
            <Divider orientation={"vertical"} />
            <div className={clsx(css["flex-center"], styles.actions)}>
              <Select
                onValueChange={update_language}
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
                {Object.entries(CODE_BLOCK_LANGUAGE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value}
                  </Option>
                ))}
              </Select>
              <Divider orientation={"vertical"} />
              <IconButton
                className={clsx(styles.x, styles.action)}
                variant={"ghost"}
              >
                <TextWrapIcon />
              </IconButton>
              <IconButton
                className={clsx(styles.x, styles.action)}
                variant={"ghost"}
              >
                <CopyIcon />
              </IconButton>
              {!read_only_ref.current && (
                <>
                  <Divider orientation={"vertical"} />
                  <IconButton
                    className={clsx(styles.x, styles.action)}
                    variant={"ghost"}
                  >
                    <SettingsIcon />
                  </IconButton>
                </>
              )}
            </div>
          </div>
          <div className={styles.editor} ref={ref} />
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
