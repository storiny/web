"use client";

import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey as $get_node_by_key, NodeKey } from "lexical";
import React from "react";

import { $is_code_block_node } from "../code-block";

const CodeBlockEditor = ({
  node_key,
  content
}: {
  content: string;
  node_key: NodeKey;
}): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const view_ref = React.useRef<EditorView | null>(null);
  const [editor] = use_lexical_composer_context();
  const read_only_ref = React.useRef<boolean>(!editor.isEditable());
  const lang_compartment = React.useMemo(() => new Compartment(), []);
  const wrap_compartment = React.useMemo(() => new Compartment(), []);
  const theme_compartment = React.useMemo(() => new Compartment(), []);

  const update_content = React.useCallback(
    (next_content: string) =>
      editor.update(() => {
        const node = $get_node_by_key(node_key);

        if ($is_code_block_node(node)) {
          node.set_content(next_content);
        }
      }),
    [editor, node_key]
  );

  const update_line_count = React.useCallback(
    (next_line_count: number) =>
      editor.update(() => {
        const node = $get_node_by_key(node_key);

        if ($is_code_block_node(node)) {
          node.set_line_count(next_line_count);
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

      const extensions: Extension[] = [wrap_compartment.of([])];

      if (!read_only_ref.current) {
        extensions.push(
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.focusChanged) {
              if (update.view.hasFocus) {
                editor.setEditable(false);
              } else if (
                document.activeElement &&
                !document.activeElement.classList.contains("cm-content")
              ) {
                editor.setEditable(true);
              }
            } else if (update.docChanged) {
              const { doc: code } = update.view.state.toJSON() || {};
              update_content(code);
              update_line_count(update.view.state.doc.lines || 1);
            }
          })
        );
      }

      const state = EditorState.create({
        doc: content,
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
  });

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
