import { Story } from "@storiny/types";
import clsx from "clsx";
import React from "react";

import Button from "~/components/button";
import IconButton from "~/components/icon-button";
import { use_toast } from "~/components/toast";
import { use_media_query } from "~/hooks/use-media-query";
import RestoreIcon from "~/icons/restore";
import {
  get_drafts_api,
  use_recover_draft_mutation,
  use_recover_story_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { handle_api_error } from "~/utils/handle-api-error";

const RestoreAction = ({
  story,
  is_draft,
  overlay
}: {
  is_draft?: boolean;
  overlay?: boolean;
  story: Story;
}): React.ReactElement => {
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [recover_story, { isLoading: is_recover_story_loading }] =
    use_recover_story_mutation();
  const [recover_draft, { isLoading: is_recover_draft_loading }] =
    use_recover_draft_mutation();
  const is_loading = is_recover_draft_loading || is_recover_story_loading;

  /**
   * Deletes a draft
   */
  const handle_delete = (): void => {
    (is_draft ? recover_draft : recover_story)({ id: story.id })
      .unwrap()
      .then(() => {
        toast(
          is_draft ? "Draft recovered" : "Story moved to drafts",
          "success"
        );
        dispatch(get_drafts_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          `Could not recover your ${is_draft ? "draft" : "story"}`
        )
      );
  };

  if (is_mobile && !overlay) {
    return (
      <IconButton
        auto_size
        loading={is_loading}
        onClick={(event): void => {
          event.stopPropagation();
          handle_delete();
        }}
        variant={"ghost"}
      >
        <RestoreIcon />
      </IconButton>
    );
  }

  return (
    <Button
      auto_size
      className={clsx(is_mobile && "force-light-mode")}
      decorator={<RestoreIcon />}
      loading={is_loading}
      onClick={(event): void => {
        event.stopPropagation();
        handle_delete();
      }}
      variant={is_mobile ? "rigid" : "hollow"}
    >
      Restore
    </Button>
  );
};

export default RestoreAction;
