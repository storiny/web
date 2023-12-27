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
import Typography from "~/components/typography";
import CopyIcon from "~/icons/copy";
import SettingsIcon from "~/icons/settings";
import TerminalIcon from "~/icons/terminal";
import TextWrapIcon from "~/icons/text-wrap";
import css from "~/theme/main.module.scss";

import { awareness_atom, undo_manager_atom } from "../../../../atoms";
import { $is_code_block_node } from "../../code-block";
import styles from "./editor.module.scss";

const CodeBlockEditor = ({
  node_key,
  content
}: {
  content: YText;
  node_key: NodeKey;
}): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const undo_manager = use_atom_value(undo_manager_atom);
  const awareness = use_atom_value(awareness_atom);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const view_ref = React.useRef<EditorView | null>(null);
  const mounted_ref = React.useRef<boolean>(false);
  const read_only_ref = React.useRef<boolean>(!editor.isEditable());
  const { height: container_height, ref: resize_observer_ref } =
    use_resize_observer();
  const lang_compartment = React.useMemo(() => new Compartment(), []);
  const wrap_compartment = React.useMemo(() => new Compartment(), []);
  const theme_compartment = React.useMemo(() => new Compartment(), []);

  /**
   * Updates the code block language
   * @param next_language The next language
   */
  const update_language = React.useCallback(
    (next_language: string) =>
      editor.update(() => {
        const node = $get_node_by_key(node_key);

        if ($is_code_block_node(node)) {
          node.set_language(next_language);
        }
      }),
    [editor, node_key]
  );

  // const handle_language = React.useCallback(
  //   (new_lang) => {
  //     updateData({ parser: new_lang });
  //
  //     if (viewRef.current && new_lang !== "none") {
  //       setLangLoading(true);
  //       setError(false);
  //
  //       getLangCallable(newLang)
  //         .then((caller) => {
  //           setParser(newLang);
  //
  //           viewRef.current!.dispatch({
  //             effects: langCompartment.reconfigure(caller())
  //           });
  //         })
  //         .catch(() => {
  //           setError(true);
  //           toast.danger("Unable to load the language");
  //         })
  //         .finally(() => setLangLoading(false));
  //     }
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [lang_compartment, update_data]
  // );

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

  React.useEffect(() => {
    if (mounted_ref.current) {
      return;
    }

    mounted_ref.current = true;
    destroy_editor();

    (async (): Promise<void> => {
      // const lang_callable = await getLangCallable(
      //   data.parser as keyof typeof lang_map
      // );
      //
      // const static_extension = readOnlyRef.current
      //   ? (await import("./extensions/static")).staticExtensions
      //   : (await import("./extensions/index")).extensions;
      //
      // const extensions: Extension[] = [
      //   static_extension,
      //   langCompartment.of(langCallable()),
      //   themeCompartment.of(mode === "light" ? light_theme : dark_theme),
      //   wrapCompartment.of([])
      // ];

      const extensions: Extension[] = [wrap_compartment.of([])];

      if (read_only_ref.current) {
        const { read_only_extensions } = await import("./extensions/read-only");
        extensions.push(...read_only_extensions);
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

        extensions.push(...editable_extensions);
      }

      if (!read_only_ref.current) {
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
        );
      }

      const state = EditorState.create({
        doc: content.toString(),
        extensions
      });

      view_ref.current = new EditorView({
        parent: ref.current!,
        state
      });

      // initializeLineHighlights(viewRef.current!, data.highlightedLines);
      // setLangLoading(false);
      // setLoading(false);
    })();

    return destroy_editor;
  }, [
    awareness,
    content,
    destroy_editor,
    editor,
    focus_editor,
    node_key,
    undo_manager,
    wrap_compartment
  ]);

  // React.useEffect(() => {
  //   if (view_ref.current) {
  //     view_ref.current?.dispatch({
  //       effects: theme_compartment.reconfigure(
  //         mode === "light" ? light_theme : dark_theme
  //       )
  //     });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [mode]);

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
