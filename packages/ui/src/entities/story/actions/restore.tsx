import { Story } from "@storiny/types";
import clsx from "clsx";
import React from "react";

import Button from "~/components/Button";
import { useToast } from "~/components/Toast";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import RestoreIcon from "~/icons/Restore";
import { get_drafts_api, use_recover_draft_mutation } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

const RestoreAction = ({
  story,
  isDraft
}: {
  isDraft?: boolean;
  story: Story;
}): React.ReactElement => {
  const toast = useToast();
  const dispatch = use_app_dispatch();
  const isMobile = useMediaQuery(breakpoints.down("mobile"));
  const [recoverDraft, { isLoading }] = use_recover_draft_mutation();

  /**
   * Deletes a draft
   */
  const handleDelete = (): void => {
    recoverDraft({ id: story.id })
      .unwrap()
      .then(() => {
        toast(`${isDraft ? "Draft" : "Story"} recovered`, "success");
        dispatch(get_drafts_api.util.resetApiState());
      })
      .catch((e) =>
        toast(
          e?.data?.error ||
            `Could not recover your ${isDraft ? "draft" : "story"}`,
          "error"
        )
      );
  };

  return (
    <Button
      autoSize
      className={clsx(isMobile && "force-light-mode")}
      decorator={<RestoreIcon />}
      loading={isLoading}
      onClick={handleDelete}
      variant={isMobile ? "rigid" : "hollow"}
    >
      Restore
    </Button>
  );
};

export default RestoreAction;
