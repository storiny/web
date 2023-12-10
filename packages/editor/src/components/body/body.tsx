"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import NoSsr from "~/components/no-ssr";

import { DOC_STATUS, doc_status_atom, DocStatus } from "../../atoms";
import ReadOnlyPlugin from "../../plugins/read-only";
import RichTextPlugin from "../../plugins/rich-text";
import { use_sidebars_shortcut } from "../../shortcuts/shortcuts";
import { is_doc_editable } from "../../utils/is-doc-editable";
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

const DOC_STATUS_TO_LABEL_MAP: Partial<Record<DocStatus, string>> = {
  [DOC_STATUS.connecting]: "Connecting…",
  [DOC_STATUS.reconnecting]: "Reconnecting…",
  [DOC_STATUS.publishing]: "Publishing…",
  [DOC_STATUS.published]: "This story has been published.",
  [DOC_STATUS.unpublished]: "This story has been unpublished.",
  [DOC_STATUS.deleted]: "This story has been deleted.",
  [DOC_STATUS.disconnected]: "Connection lost",
  [DOC_STATUS.join_realm_full]:
    "This story has reached the maximum number of editors.",
  [DOC_STATUS.join_missing_story]: "This story does not exist",
  [DOC_STATUS.join_unauthorized]:
    "You are not authorized to access this story.",
  [DOC_STATUS.doc_corrupted]: "This document has been corrupted",
  [DOC_STATUS.lifetime_exceeded]:
    "This document has been terminated due to inactivity. Reload this window to reconnect.",
  [DOC_STATUS.internal]:
    "This document has been terminated due to an internal reason.",
  [DOC_STATUS.stale_peer]:
    "You have been disconnected due to inactivity. Reload this window to reconnect."
};

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
      {...(!read_only &&
      ![DOC_STATUS.connected, DOC_STATUS.syncing].includes(doc_status)
        ? /* eslint-disable prefer-snakecase/prefer-snakecase */
          {
            style: {
              pointerEvents: "none",
              userSelect: "none",
              overflowY: "hidden",
              minHeight: "0px",
              maxHeight: "calc(100vh - calc(2 * var(--header-height)))"
            }
          }
        : /* eslint-enable prefer-snakecase/prefer-snakecase */
          {})}
    >
      {read_only && <StoryHeader />}
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        content_editable={<EditorContentEditable editable={!read_only} />}
        placeholder={<EditorPlaceholder />}
      />
      {read_only ? (
        <ReadOnlyPlugin
          initial_doc={initial_doc!}
          reading_session_token={props.story.reading_session_token || ""}
          story_id={props.story.id}
        />
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
          {is_doc_editable(doc_status) && (
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
      {!read_only &&
      ![DOC_STATUS.connected, DOC_STATUS.syncing].includes(doc_status) ? (
        <EditorLoader
          hide_progress={
            ![
              DOC_STATUS.connecting,
              DOC_STATUS.reconnecting,
              DOC_STATUS.publishing
            ].includes(doc_status)
          }
          label={DOC_STATUS_TO_LABEL_MAP[doc_status] || "Internal error"}
          overlay
          show_icon={
            ![
              DOC_STATUS.connecting,
              DOC_STATUS.reconnecting,
              DOC_STATUS.publishing
            ].includes(doc_status)
          }
        />
      ) : null}
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
