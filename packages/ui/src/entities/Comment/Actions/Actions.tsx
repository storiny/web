import { Comment } from "@storiny/types";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import { useClipboard } from "~/hooks/useClipboard";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";

const CommentActions = ({
  comment,
  isExtended
}: {
  comment: Comment;
  isExtended?: boolean;
}): React.ReactElement => {
  const copy = useClipboard();
  // const [deleteStory] = useStoryDeleteMutation();
  //
  // /**
  //  * Deletes a draft
  //  */
  // const handleDraftDelete = (): void => {
  //   deleteDraft({ id: story.id })
  //     .unwrap()
  //     .then(() => {
  //       toast("Draft deleted", "success");
  //       dispatch(getDraftsApi.util.resetApiState());
  //     })
  //     .catch((e) =>
  //       toast(e?.data?.error || "Could not delete your draft", "error")
  //     );
  // };
  //
  // const [deleteDraftElement] = useConfirmation(
  //   ({ openConfirmation }) => (
  //     <MenuItem
  //       decorator={<TrashIcon />}
  //       onSelect={(event): void => {
  //         event.preventDefault(); // Do not auto-close the menu
  //         openConfirmation();
  //       }}
  //     >
  //       Delete this draft
  //     </MenuItem>
  //   ),
  //   {
  //     color: "ruby",
  //     onConfirm: handleDraftDelete,
  //     title: "Delete this draft?",
  //     decorator: <TrashIcon />,
  //     description:
  //       "This action will delete the draft and transfer it to the deleted section. It can be restored from there within the specified time before permanent deletion."
  //   }
  // );

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"More options"}
          title={"More options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void =>
          copy(
            `${process.env.NEXT_PUBLIC_WEB_URL}/${
              comment.story?.user?.username || "story"
            }/${comment.story?.slug || comment.story_id}/comments/${comment.id}`
          )
        }
      >
        Copy link to comment
      </MenuItem>
    </Menu>
  );
};

export default CommentActions;
