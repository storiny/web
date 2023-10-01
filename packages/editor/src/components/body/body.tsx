"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/no-ssr";
import { capitalize } from "~/utils/capitalize";

import { doc_status_atom } from "../../atoms";
import ReadOnlyPlugin from "../../plugins/read-only";
import RichTextPlugin from "../../plugins/rich-text";
import { use_sidebars_shortcut } from "../../shortcuts/shortcuts";
import EditorContentEditable from "../content-editable";
import { EditorProps } from "../editor";
import EditorErrorBoundary from "../error-boundary";
import EditorLoader from "../loader";
import EditorPlaceholder from "../placeholder";
import StoryFooter from "../story-footer";
import StoryHeader from "../story-header";
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
const RegisterTools = dynamic(() => import("../register-tools"));

const EditorBody = (props: EditorProps): React.ReactElement => {
  const { role, doc_id, initial_doc, read_only } = props;
  use_sidebars_shortcut();
  const [editor] = use_lexical_composer_context();
  const is_editable = editor.isEditable();
  const doc_status = use_atom_value(doc_status_atom);

  return (
    <article
      className={clsx(styles.body, read_only && styles["read-only"])}
      data-testid={"editor-container"}
      {...(!read_only && !["connected", "syncing"].includes(doc_status)
        ? // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          { style: { pointerEvents: "none", userSelect: "none" } }
        : {})}
    >
      {read_only && <StoryHeader />}
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        content_editable={<EditorContentEditable editable={!read_only} />}
        placeholder={<EditorPlaceholder />}
      />
      {read_only ? (
        <ReadOnlyPlugin initial_doc={initial_doc!} />
      ) : (
        <React.Fragment>
          <RegisterTools />
          <NoSsr>
            <CollaborationPlugin
              id={doc_id}
              role={role}
              should_bootstrap={true}
            />
          </NoSsr>
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
          <MarkdownPlugin />
          {doc_status !== "publishing" && (
            <React.Fragment>
              <TabFocusPlugin />
              <AutoFocusPlugin />
              <FloatingTextStylePlugin />
              <FloatingLinkEditorPlugin />
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {!is_editable || read_only ? <ClickableLinkPlugin /> : null}
      {!read_only && !["connected", "syncing"].includes(doc_status) && (
        <EditorLoader
          hide_progress={[
            "disconnected",
            "reconnecting",
            "overloaded",
            "forbidden"
          ].includes(doc_status)}
          label={
            doc_status === "publishing"
              ? "Publishing…"
              : doc_status === "disconnected"
              ? "Connection lost"
              : doc_status === "overloaded"
              ? "This story has reached the maximum number of editors."
              : doc_status === "forbidden"
              ? "You do not have the access to edit this story."
              : `${capitalize(doc_status)}…`
          }
          overlay
        />
      )}
      {read_only && (
        <React.Fragment>
          <StoryFooter />
          {/* TODO: <FontSettings /> */}
        </React.Fragment>
      )}
    </article>
  );
};

export default EditorBody;
