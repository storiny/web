import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import { documentLoadingAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/use-register-tools";
import AutoFocusPlugin from "../../plugins/auto-focus";
import ColorPlugin from "../../plugins/color/color";
import FloatingLinkEditorPlugin from "../../plugins/floating-link-editor";
import FloatingTextStylePlugin from "../../plugins/floating-text-style";
import LinkPlugin from "../../plugins/link";
import ListMaxIndentLevelPlugin from "../../plugins/list-max-indent-level";
import MaxLengthPlugin from "../../plugins/max-length";
import RichTextPlugin from "../../plugins/rich-text";
import TabFocusPlugin from "../../plugins/tab-focus";
import TextEntityPlugin from "../../plugins/text-entity";
import TKPlugin from "../../plugins/tk/tk";
import EditorContentEditable from "../content-editable";
import EditorPlaceholder from "../placeholder";
import styles from "./body.module.scss";

const EditorBody = (): React.ReactElement => {
  useRegisterTools();
  const setDocumentLoading = useSetAtom(documentLoadingAtom);

  React.useEffect(() => {
    setDocumentLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article className={clsx(styles.x, styles.body)}>
      <RichTextPlugin
        ErrorBoundary={LexicalErrorBoundary}
        contentEditable={<EditorContentEditable />}
        placeholder={<EditorPlaceholder />}
      />
      <HistoryPlugin />
      <LinkPlugin />
      <ListPlugin />
      <ColorPlugin />
      <TKPlugin />
      <ListMaxIndentLevelPlugin />
      <MaxLengthPlugin />
      <TabFocusPlugin />
      <AutoFocusPlugin />
      <HorizontalRulePlugin />
      <TextEntityPlugin />
      <FloatingTextStylePlugin />
      <FloatingLinkEditorPlugin />
    </article>
  );
};

export default EditorBody;
