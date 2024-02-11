"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import NoSsr from "~/components/no-ssr";
import ConnectionCloseIcon from "~/icons/connection-close";
import InfoSquareIcon from "~/icons/info-square";

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
const ComponentPickerPlugin = dynamic(
  () => import("../../plugins/component-picker"),
  { ssr: false }
);
const ListMaxIndentLevelPlugin = dynamic(
  () => import("../../plugins/list-max-indent-level")
);
const AutoFocusPlugin = dynamic(() => import("../../plugins/auto-focus"));
const TabFocusPlugin = dynamic(() => import("../../plugins/tab-focus"));
const MarkdownPlugin = dynamic(() => import("../../plugins/markdown"));
const MentionPlugin = dynamic(() => import("../../plugins/mention"));
const MaxLengthPlugin = dynamic(() => import("../../plugins/max-length"));
const TextEntityPlugin = dynamic(() => import("../../plugins/text-entity"));
const TKPlugin = dynamic(() => import("../../plugins/tk"));
const ColorPlugin = dynamic(() => import("../../plugins/color"));
const CaptionPlugin = dynamic(() => import("../../plugins/caption"));
const EmbedPlugin = dynamic(() => import("../../plugins/embed"));
const ImagePlugin = dynamic(() => import("../../plugins/image"));
const CodeBlockPlugin = dynamic(() => import("../../plugins/code-block"));
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
  [DOC_STATUS.connected]: "Syncing…", // Document is being synced after the connection is established
  [DOC_STATUS.reconnecting]: "Reconnecting…",
  [DOC_STATUS.publishing]: "Publishing…",
  [DOC_STATUS.published]: "This story has been published.",
  [DOC_STATUS.unpublished]: "This story has been unpublished.",
  [DOC_STATUS.deleted]: "This story has been deleted.",
  [DOC_STATUS.disconnected]: "Connection lost",
  [DOC_STATUS.join_realm_full | DOC_STATUS.overloaded]:
    "This story has reached the maximum number of live members.",
  [DOC_STATUS.join_missing_story]: "This story does not exist",
  [DOC_STATUS.join_unauthorized]:
    "You are not authorized to access this story.",
  [DOC_STATUS.doc_corrupted]: "This document has been corrupted",
  [DOC_STATUS.lifetime_exceeded]:
    "This document has been terminated due to inactivity. Reload this window to reconnect.",
  [DOC_STATUS.internal_error]:
    "Unable to connect to the server. Please check your network connection and try again later",
  [DOC_STATUS.stale_peer]:
    "You have been disconnected due to inactivity. Reload this window to reconnect.",
  [DOC_STATUS.role_upgraded]:
    "The writer of this story has upgraded your access. You can now make changes to this story.",
  [DOC_STATUS.role_downgraded]:
    "The writer of this story has downgraded your access. You can now only view this story.",
  [DOC_STATUS.peer_removed]: "Your access to this story has been revoked."
};

const ButtonAction = ({
  href
}: {
  href?: string | undefined;
}): React.ReactElement => {
  const router = use_app_router();
  const [loading, set_loading] = React.useState<boolean>(false);

  return (
    <Button
      auto_size
      loading={loading}
      onClick={(): void => {
        set_loading(true);

        if (typeof href === "string") {
          router.replace(href);
        } else {
          window.location.reload();
        }
      }}
    >
      {typeof href === "string" ? "Home" : "Continue"}
    </Button>
  );
};

const EditorBody = (props: EditorProps): React.ReactElement => {
  const { role, doc_id, initial_doc, read_only } = props;
  use_sidebars_shortcut();
  const [editor] = use_lexical_composer_context();
  const is_editable = editor.isEditable();
  const doc_status = use_atom_value(doc_status_atom);
  const show_overlay =
    !read_only && ![DOC_STATUS.syncing, DOC_STATUS.synced].includes(doc_status);

  return (
    <article
      className={clsx(styles.body, read_only && styles["read-only"])}
      data-testid={"editor-container"}
      {...(show_overlay
        ? /* eslint-disable prefer-snakecase/prefer-snakecase */
          {
            style: {
              userSelect: "none",
              overflow: "hidden",
              minHeight: "0px",
              maxHeight: "1px"
            }
          }
        : /* eslint-enable prefer-snakecase/prefer-snakecase */
          {})}
    >
      {read_only && <StoryHeader />}
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        content_editable={
          <EditorContentEditable
            read_only={read_only}
            style={{ pointerEvents: show_overlay ? "none" : "auto" }}
          />
        }
        placeholder={
          read_only || role === "viewer" ? null : <EditorPlaceholder />
        }
      />
      {read_only || role === "reader" ? (
        <ReadOnlyPlugin
          initial_doc={initial_doc!}
          reading_session_token={props.story.reading_session_token || ""}
          story_id={props.story.id}
        />
      ) : (
        <React.Fragment>
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
          <CodeBlockPlugin />
          <HorizontalRulePlugin />
          <TextEntityPlugin />
          <ListMaxIndentLevelPlugin />
          <MaxLengthPlugin />
          <MarkdownPlugin />
          <MentionPlugin />
          {is_doc_editable(doc_status) && role !== "viewer" ? (
            <React.Fragment>
              <RegisterTools />
              <TabFocusPlugin />
              <AutoFocusPlugin />
              <ComponentPickerPlugin />
              <FloatingTextStylePlugin />
              <FloatingLinkEditorPlugin />
            </React.Fragment>
          ) : null}
        </React.Fragment>
      )}
      {!is_editable || read_only || role === "viewer" ? (
        <ClickableLinkPlugin />
      ) : null}
      {show_overlay && (
        <EditorLoader
          action={
            [
              DOC_STATUS.role_downgraded,
              DOC_STATUS.role_upgraded,
              DOC_STATUS.peer_removed
            ].includes(doc_status) ? (
              <ButtonAction
                href={doc_status === DOC_STATUS.peer_removed ? "/" : undefined}
              />
            ) : null
          }
          hide_progress={
            ![
              DOC_STATUS.connecting,
              DOC_STATUS.connected,
              DOC_STATUS.reconnecting,
              DOC_STATUS.publishing
            ].includes(doc_status)
          }
          icon={
            [
              DOC_STATUS.role_downgraded,
              DOC_STATUS.role_upgraded,
              DOC_STATUS.peer_removed,
              DOC_STATUS.published
            ].includes(doc_status) ? (
              <InfoSquareIcon />
            ) : ![
                DOC_STATUS.connecting,
                DOC_STATUS.connected,
                DOC_STATUS.reconnecting,
                DOC_STATUS.publishing
              ].includes(doc_status) ? (
              <ConnectionCloseIcon />
            ) : null
          }
          label={DOC_STATUS_TO_LABEL_MAP[doc_status] || "Internal error"}
          overlay
        />
      )}
      {read_only && <StoryFooter />}
    </article>
  );
};

export default EditorBody;
