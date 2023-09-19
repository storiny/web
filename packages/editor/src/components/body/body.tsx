"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/NoSsr";
import { capitalize } from "~/utils/capitalize";

import { docStatusAtom } from "../../atoms";
import { useRegisterTools } from "../../hooks/use-register-tools";
import ReadOnlyPlugin from "../../plugins/read-only";
import RichTextPlugin from "../../plugins/rich-text";
import { useSidebarsShortcut } from "../../shortcuts/shortcuts";
import EditorContentEditable from "../content-editable";
import { EditorProps } from "../editor";
import EditorErrorBoundary from "../error-boundary";
import EditorLoader from "../loader";
import EditorPlaceholder from "../placeholder";
import styles from "./body.module.scss";

const CollaborationPlugin = dynamic(
  () => import("../../plugins/collaboration")
);
const ClickableLinkPlugin = dynamic(
  () => import("@lexical/react/LexicalClickableLinkPlugin")
);
const FloatingLinkEditorPlugin = dynamic(
  () => import("../../plugins/floating-link-editor")
);
const FloatingTextStylePlugin = dynamic(
  () => import("../../plugins/floating-text-style")
);
const ListMaxIndentLevelPlugin = dynamic(
  () => import("../../plugins/list-max-indent-level")
);
const AutoFocusPlugin = dynamic(() => import("../../plugins/auto-focus"));
const TabFocusPlugin = dynamic(() => import("../../plugins/tab-focus"));
const MarkdownPlugin = dynamic(() => import("../../plugins/markdown"));
const MaxLengthPlugin = dynamic(() => import("../../plugins/max-length"));
const TextEntityPlugin = dynamic(() => import("../../plugins/text-entity"));
const TKPlugin = dynamic(() => import("../../plugins/tk"));
const ColorPlugin = dynamic(() => import("../../plugins/color"));
const CaptionPlugin = dynamic(() => import("../../plugins/caption"));
const EmbedPlugin = dynamic(() => import("../../plugins/embed"));
const ImagePlugin = dynamic(() => import("../../plugins/image"));
const LinkPlugin = dynamic(() => import("../../plugins/link"));
const ListPlugin = dynamic(() =>
  import("@lexical/react/LexicalListPlugin").then(
    ({ ListPlugin: Plugin }) => Plugin
  )
);
const HorizontalRulePlugin = dynamic(() =>
  import("@lexical/react/LexicalHorizontalRulePlugin").then(
    ({ HorizontalRulePlugin: Plugin }) => Plugin
  )
);

const EditorBody = (props: EditorProps): React.ReactElement => {
  const { role, docId, initialDoc, readOnly } = props;
  useRegisterTools();
  useSidebarsShortcut();
  const [editor] = useLexicalComposerContext();
  const isEditable = editor.isEditable();
  const docStatus = useAtomValue(docStatusAtom);

  return (
    <article
      className={clsx(styles.x, styles.body)}
      data-testid={"editor-container"}
      {...(!readOnly && !["connected", "syncing"].includes(docStatus)
        ? { style: { pointerEvents: "none", userSelect: "none" } }
        : {})}
    >
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        contentEditable={<EditorContentEditable />}
        placeholder={<EditorPlaceholder />}
      />
      {readOnly ? (
        <ReadOnlyPlugin initialDoc={initialDoc!} />
      ) : (
        <React.Fragment>
          <NoSsr>
            <CollaborationPlugin
              id={docId}
              isMainEditor
              role={role}
              shouldBootstrap={true}
            />
          </NoSsr>
          <TabFocusPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <TKPlugin />
          <ColorPlugin />
          <CaptionPlugin />
          <EmbedPlugin />
          <ImagePlugin />
          <HorizontalRulePlugin />
          <TextEntityPlugin />
          <ListMaxIndentLevelPlugin />
          <MaxLengthPlugin />
          <FloatingTextStylePlugin />
          <FloatingLinkEditorPlugin />
          <MarkdownPlugin />
        </React.Fragment>
      )}
      {!isEditable || readOnly ? <ClickableLinkPlugin /> : null}
      {!readOnly && !["connected", "syncing"].includes(docStatus) && (
        <EditorLoader
          hideProgress={[
            "disconnected",
            "reconnecting",
            "overloaded",
            "forbidden"
          ].includes(docStatus)}
          label={
            docStatus === "disconnected"
              ? "Connection lost"
              : docStatus === "overloaded"
              ? "This story has reached the maximum number of editors."
              : docStatus === "forbidden"
              ? "You do not have the access to edit this story."
              : `${capitalize(docStatus)}…`
          }
          overlay
        />
      )}
    </article>
  );
};

export default EditorBody;
