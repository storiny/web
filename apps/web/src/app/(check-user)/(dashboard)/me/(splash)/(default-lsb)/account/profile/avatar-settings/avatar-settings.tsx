import { clsx } from "clsx";
import React from "react";

import Avatar from "~/components/Avatar";
import Button from "~/components/Button";
import { useConfirmation } from "~/components/Confirmation";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import Gallery from "~/entities/Gallery";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PencilIcon from "~/icons/Pencil";
import TrashIcon from "~/icons/Trash";
import {
  mutateUser,
  selectUser,
  useAvatarSettingsMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./avatar-settings.module.scss";

const AvatarSettings = (): React.ReactElement | null => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser)!;
  const toast = useToast();
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const [avatarId, setAvatarId] = React.useState<string | null>(user.avatar_id);
  const [source, setSource] = React.useState<"pexels" | "native" | null>(null);
  const [avatarSettings, { isLoading }] = useAvatarSettingsMutation();
  const [element, confirm] = useConfirmation(
    <Button
      decorator={<TrashIcon />}
      disabled={!avatarId || isLoading}
      onClick={(): void =>
        confirm({
          color: "ruby",
          decorator: <TrashIcon />,
          onConfirm: (): void => {
            setAvatarId(null);
            setSource(null);
            dispatchAvatarSettings();
          },
          title: "Remove avatar?",
          description:
            "Are you sure you want to remove your avatar? This action cannot be undone."
        })
      }
      size={isSmallerThanTablet ? "lg" : "md"}
      variant={"hollow"}
    >
      Remove
    </Button>
  );

  /**
   * Dispatches the current avatar settings
   */
  const dispatchAvatarSettings = React.useCallback(() => {
    avatarSettings({ avatar_id: avatarId, source })
      .unwrap()
      .then((res) => {
        dispatch(
          mutateUser({ avatar_id: res.avatar_id, avatar_hex: res.avatar_hex })
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
  }, [avatarId, avatarSettings, dispatch, source, toast]);

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
              setAvatarId(asset.id);
              setSource(asset.source);
              dispatchAvatarSettings();
            }}
          >
            <Button
              decorator={<PencilIcon />}
              disabled={isLoading}
              size={isSmallerThanTablet ? "lg" : "md"}
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
