import { Story } from "@storiny/types";
import clsx from "clsx";
import React from "react";

import Button from "src/components/button";
import { use_toast } from "src/components/toast";
import { use_media_query } from "src/hooks/use-media-query";
import RestoreIcon from "src/icons/restore";
import { get_drafts_api, use_recover_draft_mutation } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

const RestoreAction = ({
  story,
  is_draft
}: {
  is_draft?: boolean;
  story: Story;
}): React.ReactElement => {
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [recover_draft, { isLoading: is_loading }] =
    use_recover_draft_mutation();

  /**
   * Deletes a draft
   */
  const handle_delete = (): void => {
    recover_draft({ id: story.id })
      .unwrap()
      .then(() => {
        toast(`${is_draft ? "Draft" : "Story"} recovered`, "success");
        dispatch(get_drafts_api.util.resetApiState());
      })
      .catch((e) =>
        toast(
          e?.data?.error ||
            `Could not recover your ${is_draft ? "draft" : "story"}`,
          "error"
        )
      );
  };

  return (
    <Button
      auto_size
      className={clsx(is_mobile && "force-light-mode")}
      decorator={<RestoreIcon />}
      loading={is_loading}
      onClick={handle_delete}
      variant={is_mobile ? "rigid" : "hollow"}
    >
      Restore
    </Button>
  );
};

export default RestoreAction;
