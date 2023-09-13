"use client";

import LexicalClickableLinkPlugin from "@lexical/react/LexicalClickableLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import NoSsr from "~/components/NoSsr";
import { capitalize } from "~/utils/capitalize";

import { docStatusAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/use-register-tools";
import AutoFocusPlugin from "../../plugins/auto-focus";
import CaptionPlugin from "../../plugins/caption/caption";
import CollaborationPlugin from "../../plugins/collaboration";
import ColorPlugin from "../../plugins/color/color";
import EmbedPlugin from "../../plugins/embed";
import FloatingLinkEditorPlugin from "../../plugins/floating-link-editor";
import FloatingTextStylePlugin from "../../plugins/floating-text-style";
import ImagePlugin from "../../plugins/image";
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
import EditorErrorBoundary from "../error-boundary";
import EditorLoader from "../loader";
import EditorPlaceholder from "../placeholder";
import styles from "./body.module.scss";

const EditorBody = (): React.ReactElement => {
  useRegisterTools();
  const [editor] = useLexicalComposerContext();
  const isEditable = editor.isEditable();
  const docStatus = useAtomValue(docStatusAtom);

  return (
    <article
      className={clsx(styles.x, styles.body)}
      {...(["connecting", "reconnecting", "disconnected"].includes(docStatus)
        ? { style: { pointerEvents: "none", userSelect: "none" } }
        : {})}
    >
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        contentEditable={<EditorContentEditable />}
        placeholder={<EditorPlaceholder />}
      />
      <NoSsr>
        <CollaborationPlugin
          id={"main"}
          isMainEditor
          providerFactory={createWebsocketProvider}
          role={"editor"}
          shouldBootstrap={true}
        />
      </NoSsr>
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
      <MarkdownPlugin />
      <HorizontalRulePlugin />
      <TextEntityPlugin />
      <ImagePlugin />
      <CaptionPlugin />
      <EmbedPlugin />
      {!isEditable && <LexicalClickableLinkPlugin />}
      {["connecting", "reconnecting", "disconnected"].includes(docStatus) && (
        <EditorLoader
          hideProgress={["disconnected", "reconnecting"].includes(docStatus)}
          label={
            docStatus === "disconnected"
              ? "Connection lost"
              : `${capitalize(docStatus)}…`
          }
          overlay
        />
      )}
    </article>
  );
};

export default EditorBody;
