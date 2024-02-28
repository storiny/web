import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/avatar";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import PencilIcon from "~/icons/pencil";
import TrashIcon from "~/icons/trash";
import {
  mutate_user,
  select_user,
  use_avatar_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./avatar-settings.module.scss";

const AvatarSettings = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user)!;
  const toast = use_toast();
  const [avatar_id, set_avatar_id] = React.useState<string | null>(
    user.avatar_id
  );
  const [mutate_avatar_settings, { isLoading: is_loading }] =
    use_avatar_settings_mutation();
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        decorator={<TrashIcon />}
        disabled={!avatar_id || is_loading}
        onClick={open_confirmation}
        variant={"hollow"}
      >
        Remove
      </Button>
    ),
    {
      color: "ruby",
      decorator: <TrashIcon />,
      on_confirm: (): void => {
        set_avatar_id(null);
        dispatch_avatar_settings();
      },
      title: "Remove avatar?",
      description:
        "Are you sure you want to remove your avatar? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current avatar settings
   */
  const dispatch_avatar_settings = React.useCallback(
    (avatar_id?: string) => {
      mutate_avatar_settings({ avatar_id: avatar_id || null })
        .unwrap()
        .then((res) => {
          dispatch(
            mutate_user({
              avatar_id: res.avatar_id,
              avatar_hex: res.avatar_hex
            })
          );
          set_avatar_id(res.avatar_id);
          toast(
            `Avatar ${
              res.avatar_id === null ? "removed" : "updated"
            } successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not update your avatar")
        );
    },
    [mutate_avatar_settings, dispatch, toast]
  );

  return (
    <div className={clsx(css["flex-col"], styles["avatar-settings"])}>
      <div className={clsx(css["flex-center"], styles.header)}>
        <Avatar
          alt={""}
          avatar_id={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"xl2"}
        />
        <div className={css["flex-col"]}>
          <Gallery
            on_confirm={(asset): void => {
              set_avatar_id(asset.key);
              dispatch_avatar_settings(asset.key);
            }}
          >
            <Button
              auto_size
              check_auth
              decorator={<PencilIcon />}
              disabled={is_loading}
              variant={"hollow"}
            >
              Edit
            </Button>
          </Gallery>
          <Spacer orientation={"vertical"} />
          {element}
        </div>
      </div>
      <Typography color={"minor"} level={"body3"}>
        We recommend using a PNG, JPG, WEBP, or GIF with a minimum resolution of
        640 pixels in a square shape.
      </Typography>
    </div>
  );
};

export default AvatarSettings;
