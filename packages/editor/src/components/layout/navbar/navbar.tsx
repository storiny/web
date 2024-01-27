"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { SUPPORT_ARTICLE_MAP } from "@storiny/shared/src/constants/support-articles";
import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import { $getRoot as $get_root, $isTextNode as $is_text_node } from "lexical";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import Logo from "~/brand/logo";
import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Menubar from "~/components/menubar";
import MenubarMenu from "~/components/menubar-menu";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Tooltip from "~/components/tooltip";
import { use_media_query } from "~/hooks/use-media-query";
import ChevronIcon from "~/icons/chevron";
import QuestionMarkIcon from "~/icons/question-mark";
import VersionHistoryIcon from "~/icons/version-history";
import {
  use_publish_story_mutation,
  use_recover_draft_mutation,
  use_recover_story_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";
import { handle_api_error } from "~/utils/handle-api-error";

import {
  DOC_STATUS,
  doc_status_atom,
  story_metadata_atom
} from "../../../atoms";
import { $is_tk_node } from "../../../nodes/tk";
import { $get_children_recursively } from "../../../utils/get-children-recursively";
import { is_doc_editable } from "../../../utils/is-doc-editable";
import { StoryStatus } from "../../editor";
import DocStatus from "./doc-status";
import MusicItem from "./music-item";
import styles from "./navbar.module.scss";
import ShareItem from "./share-item";

const EditorPresence = dynamic(() => import("./presence"));
const EditorMenubarItems = dynamic(() => import("./menubar-items"), {
  loading: ({ isLoading: is_loading, error, retry }) =>
    error && !is_loading ? (
      <div className={css["flex-center"]} style={{ paddingBlock: "32px" }}>
        <Button color={"ruby"} onClick={retry} variant={"hollow"}>
          Retry
        </Button>
      </div>
    ) : (
      <SuspenseLoader />
    )
});

// Menubar

const EditorMenubar = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => (
  <Menubar className={css["full-h"]}>
    <MenubarMenu
      slot_props={{
        content: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          style: { minWidth: "176px" }
        }
      }}
      trigger={
        <Button
          className={clsx(
            css["focus-invert"],
            css["flex-center"],
            styles.x,
            styles.menu
          )}
          variant={"ghost"}
        >
          <Logo size={26} />
          <span className={styles.chevron}>
            <ChevronIcon rotation={180} />
          </span>
        </Button>
      }
    >
      <EditorMenubarItems disabled={disabled} />
    </MenubarMenu>
  </Menubar>
);

// Publish

const Publish = ({
  disabled,
  status
}: {
  disabled?: boolean;
  status: Exclude<StoryStatus, "deleted">;
}): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const router = use_app_router();
  const story = use_atom_value(story_metadata_atom);
  const [editor] = use_lexical_composer_context();
  const tk_count_ref = React.useRef<number>(0);
  const word_count_ref = React.useRef<number>(1);
  const [doc_status, set_doc_status] = use_atom(doc_status_atom);
  const [publish_story] = use_publish_story_mutation();

  /**
   * Publishes the story
   */
  const handle_publish = React.useCallback(() => {
    set_doc_status(DOC_STATUS.publishing);

    publish_story({ id: story.id, status, word_count: word_count_ref.current })
      .unwrap()
      .then(() =>
        router.replace(`/${story.user?.username || "story"}/${story.id}`)
      )
      .catch((error) => {
        set_doc_status(DOC_STATUS.connected);
        handle_api_error(error, toast, null, "Could not publish your story");
      });
  }, [publish_story, router, set_doc_status, status, story, toast]);

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        check_auth
        disabled={disabled || !is_doc_editable(doc_status)}
        onClick={(event): void => {
          event.preventDefault(); // Prevent opening the modal

          new Promise<[number, number]>((resolve) => {
            editor.getEditorState().read(() => {
              const children = $get_children_recursively($get_root());
              const next_word_count = children
                .filter($is_text_node)
                .reduce(
                  (prev_value, next_value) =>
                    prev_value +
                    next_value.getTextContent().trim().split(/\s+/).length,
                  1
                );

              resolve([children.filter($is_tk_node).length, next_word_count]);
            });
          })
            .then(([tk_count, word_count]) => {
              tk_count_ref.current = tk_count;
              word_count_ref.current = word_count;

              if (tk_count > 0) {
                open_confirmation();
              } else {
                handle_publish();
              }
            })
            .catch(() => toast("Could not process your story", "error"));
        }}
      >
        {story.published_at && !is_smaller_than_mobile
          ? "Publish changes"
          : "Publish"}
      </Button>
    ),
    {
      on_cancel: handle_publish,
      title: "Are you sure you want to publish?",
      cancel_label: "Publish anyway",
      confirm_label: "Edit",
      description: (
        <>
          You still have{" "}
          <span className={css["t-medium"]}>
            {abbreviate_number(tk_count_ref.current)}
          </span>{" "}
          <span
            className={css["t-medium"]}
            style={{ color: "var(--plum-300)" }}
          >
            TK
          </span>{" "}
          {tk_count_ref.current === 1 ? "placeholder" : "placeholders"} in your
          story.{" "}
          <Link
            href={SUPPORT_ARTICLE_MAP.TK_PLACEHOLDERS}
            target={"_blank"}
            underline={"always"}
          >
            Learn more
          </Link>
        </>
      )
    }
  );

  return element;
};

// Recover

const Recover = ({ is_draft }: { is_draft: boolean }): React.ReactElement => {
  const toast = use_toast();
  const router = use_app_router();
  const story = use_atom_value(story_metadata_atom);
  const [loading, set_loading] = React.useState<boolean>(false);
  const [recover_story] = use_recover_story_mutation();
  const [recover_draft] = use_recover_draft_mutation();

  /**
   * Publishes the story
   */
  const handle_recover = React.useCallback(() => {
    set_loading(true);

    (is_draft ? recover_draft : recover_story)({ id: story.id })
      .unwrap()
      .then(() => {
        router.refresh();
      })
      .catch((error) => {
        set_loading(false);
        handle_api_error(
          error,
          toast,
          null,
          `Could not recover your ${is_draft ? "draft" : "story"}`
        );
      });
  }, [is_draft, recover_draft, recover_story, router, story.id, toast]);

  return (
    <Button
      check_auth
      loading={loading}
      onClick={handle_recover}
      variant={"hollow"}
    >
      Recover
    </Button>
  );
};

const EditorNavbar = ({
  status
}: {
  status: StoryStatus;
}): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const story = use_atom_value(story_metadata_atom);
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = [
    DOC_STATUS.connecting,
    DOC_STATUS.reconnecting
  ].includes(doc_status);

  return (
    <header className={styles["editor-navbar"]} role={"banner"}>
      <div className={clsx(css["flex-center"], styles["full-height"])}>
        <EditorMenubar
          disabled={
            status === "deleted" || document_loading || story.role === "viewer"
          }
        />
        {!is_smaller_than_tablet && status !== "deleted" ? (
          <React.Fragment>
            <Tooltip content={"Version history"}>
              <IconButton
                className={clsx(css["focus-invert"], styles.x, styles.button)}
                // TODO: disabled={document_loading}
                // Implement version history
                disabled
                size={"lg"}
                variant={"ghost"}
              >
                <VersionHistoryIcon />
              </IconButton>
            </Tooltip>
            <MusicItem disabled={document_loading} />
            <Tooltip content={"Help"}>
              <IconButton
                as={NextLink}
                className={clsx(css["focus-invert"], styles.x, styles.button)}
                disabled={document_loading}
                href={"https://storiny.com/storiny/167864443077704"}
                size={"lg"}
                target={"_blank"}
                variant={"ghost"}
              >
                <QuestionMarkIcon />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        ) : null}
      </div>
      {!is_smaller_than_mobile && status !== "deleted" ? (
        <React.Fragment>
          <Spacer className={css["f-grow"]} size={2} />
          <EditorPresence />
        </React.Fragment>
      ) : null}
      <Spacer className={css["f-grow"]} size={2} />
      <div className={css["flex-center"]}>
        {status !== "deleted" && <DocStatus />}
        <Spacer size={2} />
        {status !== "deleted" ? (
          <React.Fragment>
            <ShareItem
              disabled={
                document_loading ||
                !story.is_writer ||
                !is_doc_editable(doc_status)
              }
            />
            <Spacer />
          </React.Fragment>
        ) : null}
        {status === "deleted" ? (
          <Recover is_draft={!story.published_at} />
        ) : (
          <Publish
            disabled={document_loading || !story.is_writer}
            status={status}
          />
        )}
      </div>
    </header>
  );
};

export default EditorNavbar;
