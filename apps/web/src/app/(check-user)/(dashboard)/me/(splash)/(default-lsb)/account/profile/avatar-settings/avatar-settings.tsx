import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useConfirmation } from "~/components/Confirmation";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import Gallery from "~/entities/gallery";
import PencilIcon from "~/icons/Pencil";
import TrashIcon from "~/icons/Trash";
import {
  mutate_user,
  select_user,
  use_avatar_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import styles from "./avatar-settings.module.scss";

const AvatarSettings = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user)!;
  const toast = useToast();
  const [avatarId, setAvatarId] = React.useState<string | null>(user.avatar_id);
  const [mutateAvatarSettings, { isLoading }] = use_avatar_settings_mutation();
  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <Button
        autoSize
        checkAuth
        decorator={<TrashIcon />}
        disabled={!avatarId || isLoading}
        onClick={openConfirmation}
        variant={"hollow"}
      >
        Remove
      </Button>
    ),
    {
      color: "ruby",
      decorator: <TrashIcon />,
      onConfirm: (): void => {
        setAvatarId(null);
        dispatchAvatarSettings();
      },
      title: "Remove avatar?",
      description:
        "Are you sure you want to remove your avatar? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current avatar settings
   */
  const dispatchAvatarSettings = React.useCallback(() => {
    mutateAvatarSettings({ avatar_id: avatarId })
      .unwrap()
      .then((res) => {
        dispatch(
          mutate_user({ avatar_id: res.avatar_id, avatar_hex: res.avatar_hex })
        );
        setAvatarId(res.avatar_id);
        toast(
          `Avatar ${
            res.avatar_id === null ? "remove" : "updated"
          } successfully`,
          "success"
        );
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not update your avatar", "error")
      );
  }, [avatarId, mutateAvatarSettings, dispatch, toast]);

  return (
    <div className={clsx("flex-col", styles.x, styles["avatar-settings"])}>
      <div className={clsx("flex-center", styles.x, styles.header)}>
        <Avatar
          alt={""}
          avatarId={user.avatar_id}
          hex={user.avatar_hex}
          label={user.name}
          size={"xl2"}
        />
        <div className={"flex-col"}>
          <Gallery
            onConfirm={(asset): void => {
              setAvatarId(asset.key);
              dispatchAvatarSettings();
            }}
          >
            <Button
              autoSize
              checkAuth
              decorator={<PencilIcon />}
              disabled={isLoading}
              variant={"hollow"}
            >
              Edit
            </Button>
          </Gallery>
          <Spacer orientation={"vertical"} />
          {element}
        </div>
      </div>
      <Typography className={"t-minor"} level={"body3"}>
        We recommend using a PNG, JPG, WEBP, or GIF with a minimum resolution of
        640 pixels in a square shape.
      </Typography>
    </div>
  );
};

export default AvatarSettings;
