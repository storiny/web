import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import { use_toast } from "~/components/toast";
import Gallery from "~/entities/gallery";
import PencilIcon from "~/icons/pencil";
import PhotoPlusIcon from "~/icons/photo-plus";
import TrashIcon from "~/icons/trash";
import {
  mutate_user,
  select_user,
  use_banner_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import styles from "./banner-settings.module.scss";

const BannerSettings = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const user = use_app_selector(select_user)!;
  const toast = use_toast();
  const [banner_id, set_banner_id] = React.useState<string | null>(
    user.banner_id
  );
  const [mutate_banner_settings, { isLoading: is_loading }] =
    use_banner_settings_mutation();
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <IconButton
        aria-label={"Remove banner"}
        auto_size
        disabled={!banner_id || is_loading}
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
        set_banner_id(null);
        dispatch_banner_settings();
      },
      title: "Remove banner?",
      description:
        "Are you sure you want to remove your banner? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current banner settings
   */
  const dispatch_banner_settings = React.useCallback(() => {
    mutate_banner_settings({ banner_id: banner_id })
      .unwrap()
      .then((res) => {
        dispatch(
          mutate_user({ banner_id: res.banner_id, banner_hex: res.banner_hex })
        );
        set_banner_id(res.banner_id);
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
  }, [banner_id, mutate_banner_settings, dispatch, toast]);

  return (
    <AspectRatio
      className={clsx(styles.x, styles["aspect-ratio"])}
      ratio={4.45}
    >
      {banner_id ? (
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
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
            css["flex-center"],
            css["full-h"],
            css["full-w"],
            styles.placeholder
          )}
        >
          <PhotoPlusIcon />
        </div>
      )}
      <div className={clsx(css["flex-center"], styles["banner-actions"])}>
        <Gallery
          on_confirm={(asset): void => {
            set_banner_id(asset.key);
            dispatch_banner_settings();
          }}
        >
          <IconButton
            aria-label={"Edit banner"}
            auto_size
            disabled={is_loading}
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
