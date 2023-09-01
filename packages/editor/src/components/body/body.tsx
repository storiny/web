import LexicalClickableLinkPlugin from "@lexical/react/LexicalClickableLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import { documentLoadingAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/use-register-tools";
import AutoFocusPlugin from "../../plugins/auto-focus";
import BlockDraggerPlugin from "../../plugins/block-dragger";
import CollaborationPlugin from "../../plugins/collaboration";
import ColorPlugin from "../../plugins/color/color";
import FloatingLinkEditorPlugin from "../../plugins/floating-link-editor";
import FloatingTextStylePlugin from "../../plugins/floating-text-style";
import LinkPlugin from "../../plugins/link";
import ListMaxIndentLevelPlugin from "../../plugins/list-max-indent-level";
import MarkdownPlugin from "../../plugins/markdown";
import MaxLengthPlugin from "../../plugins/max-length";
import RichTextPlugin from "../../plugins/rich-text";
import TabFocusPlugin from "../../plugins/tab-focus";
import TextEntityPlugin from "../../plugins/text-entity";
import TKPlugin from "../../plugins/tk/tk";
import { createWebsocketProvider } from "../../utils/create-ws-provider";
import EditorContentEditable from "../content-editable";
import EditorPlaceholder from "../placeholder";
import styles from "./body.module.scss";

const EditorBody = (): React.ReactElement => {
  useRegisterTools();
  const [editor] = useLexicalComposerContext();
  const setDocumentLoading = useSetAtom(documentLoadingAtom);
  const isEditable = editor.isEditable();

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
      <CollaborationPlugin
        id={"main"}
        providerFactory={createWebsocketProvider}
        shouldBootstrap={true}
      />
      <TabFocusPlugin />
      <AutoFocusPlugin />
      <LinkPlugin />
      <ListPlugin />
      <ColorPlugin />
      <TKPlugin />
      <ListMaxIndentLevelPlugin />
      <MaxLengthPlugin />
      <FloatingTextStylePlugin />
      <FloatingLinkEditorPlugin />
      <BlockDraggerPlugin />
      <MarkdownPlugin />
      <HorizontalRulePlugin />
      <TextEntityPlugin />
      {!isEditable && <LexicalClickableLinkPlugin />}
    </article>
  );
};

export default EditorBody;
