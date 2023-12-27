"use client";

import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { basicSetup as basic_setup } from "codemirror";
import { useAtomValue as use_atom_value } from "jotai";
import { $getNodeByKey as $get_node_by_key, NodeKey } from "lexical";
import React from "react";
import { Text as YText } from "yjs";

import { awareness_atom, undo_manager_atom } from "../../../atoms";
import {
  code_block_remote_selections,
  code_block_remote_selections_theme
} from "../../../collaboration/code-block/selection";
import {
  code_block_sync,
  code_block_sync_facet,
  YSyncConfig
} from "../../../collaboration/code-block/sync";
import {
  code_block_undo_manager,
  code_block_undo_manager_facet,
  CodeBlockUndoManagerConfig,
  redo,
  undo
} from "../../../collaboration/code-block/undo-manager";
import { $is_code_block_node } from "../code-block";

const CodeBlockEditor = ({
  node_key,
  collab_text
}: {
  collab_text: YText;
  node_key: NodeKey;
}): React.ReactElement => {
  const undo_manager = use_atom_value(undo_manager_atom);
  const awareness = use_atom_value(awareness_atom);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const view_ref = React.useRef<EditorView | null>(null);
  const [editor] = use_lexical_composer_context();
  const read_only_ref = React.useRef<boolean>(!editor.isEditable());
  const lang_compartment = React.useMemo(() => new Compartment(), []);
  const wrap_compartment = React.useMemo(() => new Compartment(), []);
  const theme_compartment = React.useMemo(() => new Compartment(), []);

  const update_language = React.useCallback(
    (next_content: string) =>
      editor.update(() => {
        const node = $get_node_by_key(node_key);

        if ($is_code_block_node(node)) {
          node.set_language(next_content);
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

  React.useEffect(() => {
    if (view_ref.current) {
      view_ref.current?.destroy();
    }

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

      const collab_plugins = [
        code_block_sync_facet.of(new YSyncConfig(collab_text, awareness)),
        code_block_sync
      ];

      if (awareness !== null) {
        collab_plugins.push(
          code_block_remote_selections_theme,
          code_block_remote_selections
        );
      }

      if (undo_manager !== null) {
        collab_plugins.push(
          code_block_undo_manager_facet.of(
            new CodeBlockUndoManagerConfig(undo_manager)
          ),
          code_block_undo_manager,
          EditorView.domEventHandlers({
            beforeinput: (e, view) => {
              if (e.inputType === "historyUndo") {
                return undo(view);
              }

              if (e.inputType === "historyRedo") {
                return redo(view);
              }

              return false;
            }
          })
        );
      }

      const extensions: Extension[] = [
        basic_setup,
        wrap_compartment.of([]),
        collab_plugins
      ];

      if (!read_only_ref.current) {
        extensions.push(
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.focusChanged) {
              if (update.view.hasFocus) {
                editor.setEditable(false);
              } else if (
                !document.activeElement ||
                (document.activeElement &&
                  !document.activeElement.classList.contains("cm-content"))
              ) {
                update.view.dispatch({ selection: { anchor: 0 } });

                editor.setEditable(true);

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
            } else if (update.docChanged) {
              // const { doc: code } = update.view.state.toJSON() || {};
              // collab_text.insert(0, code);
              // update_content(code);
              // update_line_count(update.view.state.doc.lines || 1);
            }
          })
        );
      }

      const state = EditorState.create({
        doc: collab_text.toString(),
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

    return () => {
      if (view_ref.current) {
        view_ref.current?.destroy();
      }
    };
  }, [awareness, collab_text, editor, undo_manager, wrap_compartment]);

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

  return <div ref={ref} />;
};

export default CodeBlockEditor;
