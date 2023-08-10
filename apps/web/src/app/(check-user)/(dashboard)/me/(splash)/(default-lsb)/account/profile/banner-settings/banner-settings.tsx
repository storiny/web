import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import { useToast } from "~/components/Toast";
import Gallery from "~/entities/Gallery";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PencilIcon from "~/icons/Pencil";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import TrashIcon from "~/icons/Trash";
import {
  mutateUser,
  selectUser,
  useBannerSettingsMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { getCdnUrl } from "~/utils/getCdnUrl";

import styles from "./banner-settings.module.scss";

const BannerSettings = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser)!;
  const toast = useToast();
  const [bannerId, setBannerId] = React.useState<string | null>(user.banner_id);
  const [source, setSource] = React.useState<"pexels" | "native" | null>(null);
  const [bannerSettings, { isLoading }] = useBannerSettingsMutation();
  const [element] = useConfirmation(
    ({ openConfirmation }) => (
      <IconButton
        aria-label={"Remove banner"}
        autoSize
        disabled={!bannerId || isLoading}
        onClick={openConfirmation}
        title={"Remove banner"}
      >
        <TrashIcon />
      </IconButton>
    ),
    {
      color: "ruby",
      decorator: <TrashIcon />,
      onConfirm: (): void => {
        setBannerId(null);
        setSource(null);
        dispatchBannerSettings();
      },
      title: "Remove banner?",
      description:
        "Are you sure you want to remove your banner? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current banner settings
   */
  const dispatchBannerSettings = React.useCallback(() => {
    bannerSettings({ banner_id: bannerId, source })
      .unwrap()
      .then((res) => {
        dispatch(
          mutateUser({ banner_id: res.banner_id, banner_hex: res.banner_hex })
        );
        setBannerId(res.banner_id);
        toast(
          `Banner ${
            res.banner_id === null ? "remove" : "updated"
          } successfully`,
          "success"
        );
      })
      .catch((e) =>
        toast(e?.data?.error || "Could not update your banner", "error")
      );
  }, [bannerId, bannerSettings, dispatch, source, toast]);

  return (
    <AspectRatio
      className={clsx(styles.x, styles["aspect-ratio"])}
      ratio={4.45}
    >
      {bannerId ? (
        <Image
          alt={""}
          className={clsx(styles.x, styles.banner)}
          hex={user.banner_hex}
          imgId={user.banner_id}
          slotProps={{
            image: {
              sizes: [
                `${breakpoints.up("desktop")} 680px`,
                `${breakpoints.up("mobile")} calc(100vw - 72px)`,
                "100vw"
              ].join(","),
              srcSet: [
                `${getCdnUrl(user.banner_id, ImageSize.W_1440)} 1440w`,
                `${getCdnUrl(user.banner_id, ImageSize.W_1024)} 1024w`,
                `${getCdnUrl(user.banner_id, ImageSize.W_860)} 860w`,
                `${getCdnUrl(user.banner_id, ImageSize.W_640)} 640w`,
                `${getCdnUrl(user.banner_id, ImageSize.W_320)} 320w`
              ].join(",")
            }
          }}
        />
      ) : (
        <div className={clsx("flex-center", styles.x, styles.placeholder)}>
          <PhotoPlusIcon />
        </div>
      )}
      <div className={clsx("flex-center", styles.x, styles["banner-actions"])}>
        <Gallery
          onConfirm={(asset): void => {
            setBannerId(asset.id);
            setSource(asset.source);
            dispatchBannerSettings();
          }}
        >
          <IconButton
            aria-label={"Edit banner"}
            autoSize
            disabled={isLoading}
            title={"Edit banner"}
          >
            <PencilIcon />
          </IconButton>
        </Gallery>
        {element}
      </div>
    </AspectRatio>
  );
};

export default BannerSettings;
