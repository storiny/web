import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "../../../../../../../../../../../../packages/ui/src/components/aspect-ratio";
import { use_confirmation } from "../../../../../../../../../../../../packages/ui/src/components/confirmation";
import IconButton from "../../../../../../../../../../../../packages/ui/src/components/icon-button";
import Image from "../../../../../../../../../../../../packages/ui/src/components/image";
import { use_toast } from "../../../../../../../../../../../../packages/ui/src/components/toast";
import Gallery from "~/entities/gallery";
import PencilIcon from "~/icons/Pencil";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import TrashIcon from "~/icons/Trash";
import {
  mutate_user,
  select_user,
  use_banner_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { get_cdn_url } from "../../../../../../../../../../../../packages/ui/src/utils/get-cdn-url";

import styles from "./banner-settings.module.scss";

const BannerSettings = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user)!;
  const toast = use_toast();
  const [bannerId, setBannerId] = React.useState<string | null>(user.banner_id);
  const [mutateBannerSettings, { isLoading }] = use_banner_settings_mutation();
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <IconButton
        aria-label={"Remove banner"}
        auto_size
        disabled={!bannerId || isLoading}
        onClick={open_confirmation}
        title={"Remove banner"}
      >
        <TrashIcon />
      </IconButton>
    ),
    {
      color: "ruby",
      decorator: <TrashIcon />,
      on_confirm: (): void => {
        setBannerId(null);
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
    mutateBannerSettings({ banner_id: bannerId })
      .unwrap()
      .then((res) => {
        dispatch(
          mutate_user({ banner_id: res.banner_id, banner_hex: res.banner_hex })
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
  }, [bannerId, mutateBannerSettings, dispatch, toast]);

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
          img_key={user.banner_id}
          slot_props={{
            image: {
              sizes: [
                `${BREAKPOINTS.up("desktop")} 680px`,
                `${BREAKPOINTS.up("mobile")} calc(100vw - 72px)`,
                "100vw"
              ].join(","),
              srcSet: [
                `${get_cdn_url(user.banner_id, ImageSize.W_1440)} 1440w`,
                `${get_cdn_url(user.banner_id, ImageSize.W_1024)} 1024w`,
                `${get_cdn_url(user.banner_id, ImageSize.W_860)} 860w`,
                `${get_cdn_url(user.banner_id, ImageSize.W_640)} 640w`,
                `${get_cdn_url(user.banner_id, ImageSize.W_320)} 320w`
              ].join(",")
            }
          }}
        />
      ) : (
        <div
          className={clsx(
            "flex-center",
            "full-h",
            "full-w",
            styles.x,
            styles.placeholder
          )}
        >
          <PhotoPlusIcon />
        </div>
      )}
      <div className={clsx("flex-center", styles.x, styles["banner-actions"])}>
        <Gallery
          on_confirm={(asset): void => {
            setBannerId(asset.key);
            dispatchBannerSettings();
          }}
        >
          <IconButton
            aria-label={"Edit banner"}
            auto_size
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
