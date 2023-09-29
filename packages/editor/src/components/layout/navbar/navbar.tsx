"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import SuspenseLoader from "@storiny/web/src/common/suspense-loader";
import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import { $getRoot } from "lexical";
import { RedirectType } from "next/dist/client/components/redirect";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import Logo from "../../../../../ui/src/brand/logo";
import Button from "../../../../../ui/src/components/button";
import { use_confirmation } from "../../../../../ui/src/components/confirmation";
import IconButton from "../../../../../ui/src/components/icon-button";
import Link from "../../../../../ui/src/components/link";
import Menubar from "../../../../../ui/src/components/menubar";
import MenubarMenu from "../../../../../ui/src/components/menubar-menu";
import Spacer from "../../../../../ui/src/components/spacer";
import { use_toast } from "../../../../../ui/src/components/toast";
import Tooltip from "../../../../../ui/src/components/tooltip";
import { use_media_query } from "../../../../../ui/src/hooks/use-media-query";
import ChevronIcon from "~/icons/Chevron";
import QuestionMarkIcon from "~/icons/QuestionMark";
import VersionHistoryIcon from "~/icons/VersionHistory";
import {
  use_publish_story_mutation,
  use_recover_story_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { abbreviate_number } from "../../../../../ui/src/utils/abbreviate-number";

import { docStatusAtom, storyMetadataAtom } from "../../../atoms";
import { $isTKNode } from "../../../nodes/tk";
import { $getChildrenRecursively } from "../../../utils/get-children-recursively";
import { StoryStatus } from "../../editor";
import DocStatus from "./doc-status";
import MusicItem from "./music-item";
import styles from "./navbar.module.scss";

const EditorPresence = dynamic(() => import("./presence"));
const EditorMenubarItems = dynamic(() => import("./menubar-items"), {
  loading: ({ isLoading, error, retry }) =>
    error && !isLoading ? (
      <div className={"flex-center"} style={{ paddingBlock: "32px" }}>
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
  <Menubar className={"full-h"}>
    <MenubarMenu
      slot_props={{
        content: {
          style: { minWidth: "176px" }
        }
      }}
      trigger={
        <Button
          className={clsx("focus-invert", "flex-center", styles.x, styles.menu)}
          variant={"ghost"}
        >
          <Logo size={26} />
          <span className={clsx(styles.x, styles.chevron)}>
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
  const router = useRouter();
  const story = use_atom_value(storyMetadataAtom);
  const [editor] = useLexicalComposerContext();
  const [tkCount, setTkCount] = React.useState<number>(0);
  const [docStatus, setDocStatus] = use_atom(docStatusAtom);
  const [publishStory] = use_publish_story_mutation();

  /**
   * Publishes the story
   */
  const handlePublish = React.useCallback(() => {
    setDocStatus("publishing");
    publishStory({ id: story.id, status })
      .unwrap()
      .then(() => router.refresh())
      .catch((e) => {
        setDocStatus("connected");
        toast(e?.data?.error || "Could not publish your story", "error");
      });
  }, [publishStory, setDocStatus, status, story.id, toast]);

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        check_auth
        disabled={disabled || docStatus === "publishing"}
        onClick={(): void => {
          new Promise<number>((resolve) => {
            editor.getEditorState().read(() => {
              resolve(
                $getChildrenRecursively($getRoot()).filter($isTKNode).length
              );
            });
          })
            .then((tkCount) => {
              setTkCount(tkCount);

              if (tkCount > 0) {
                open_confirmation();
              } else {
                handlePublish();
              }
            })
            .catch(() => toast("Could not process your story", "error"));
        }}
      >
        Publish
      </Button>
    ),
    {
      on_cancel: handlePublish,
      title: "Are you sure you want to publish?",
      cancel_label: "Publish anyway",
      confirm_label: "Edit",
      description: (
        <>
          You still have{" "}
          <span className={"t-medium"}>{abbreviate_number(tkCount)}</span>{" "}
          <span className={"t-medium"} style={{ color: "var(--plum-300)" }}>
            TK
          </span>{" "}
          {tkCount === 1 ? "placeholder" : "placeholders"} in your story.{" "}
          <Link href={"/guides/tk"} target={"_blank"} underline={"always"}>
            Learn more
          </Link>
        </>
      )
    }
  );

  return element;
};

// Recover

const Recover = (): React.ReactElement => {
  const toast = use_toast();
  const story = use_atom_value(storyMetadataAtom);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [recoverStory] = use_recover_story_mutation();

  /**
   * Publishes the story
   */
  const handleRecover = React.useCallback(() => {
    setLoading(true);
    recoverStory({ id: story.id })
      .unwrap()
      .then(() => {
        redirect(`/doc/${story.id}`, RedirectType.replace);
      })
      .catch((e) => {
        setLoading(false);
        toast(e?.data?.error || "Could not recover your story", "error");
      });
  }, [recoverStory, story.id, toast]);

  return (
    <Button
      check_auth
      loading={loading}
      onClick={handleRecover}
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
  const docStatus = use_atom_value(docStatusAtom);
  const documentLoading = ["connecting", "reconnecting"].includes(docStatus);

  return (
    <header className={clsx(styles.x, styles["editor-navbar"])} role={"banner"}>
      <div className={clsx("flex-center", styles.x, styles["full-height"])}>
        <EditorMenubar disabled={status === "deleted" || documentLoading} />
        {!is_smaller_than_tablet && status !== "deleted" ? (
          <React.Fragment>
            <Tooltip content={"Version history"}>
              <IconButton
                className={clsx("focus-invert", styles.x, styles.button)}
                // TODO: disabled={documentLoading}
                disabled
                size={"lg"}
                variant={"ghost"}
              >
                <VersionHistoryIcon />
              </IconButton>
            </Tooltip>
            <MusicItem disabled={documentLoading} />
            <Tooltip content={"Help"}>
              <IconButton
                as={NextLink}
                className={clsx("focus-invert", styles.x, styles.button)}
                disabled={documentLoading}
                href={"/help"}
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
          <Spacer className={"f-grow"} size={2} />
          <EditorPresence />
        </React.Fragment>
      ) : null}
      <Spacer className={"f-grow"} size={2} />
      <div className={clsx("flex-center")}>
        {status !== "deleted" && <DocStatus />}
        <Spacer size={2} />
        {status !== "deleted" ? (
          <React.Fragment>
            <Button
              disabled
              // TODO: Fix on stable disabled={documentLoading}
              variant={"hollow"}
            >
              Share
            </Button>
            <Spacer />
          </React.Fragment>
        ) : null}
        {status === "deleted" ? (
          <Recover />
        ) : (
          <Publish disabled={documentLoading} status={status} />
        )}
      </div>
    </header>
  );
};

export default EditorNavbar;
