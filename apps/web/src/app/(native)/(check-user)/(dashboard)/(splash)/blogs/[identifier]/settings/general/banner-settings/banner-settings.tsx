import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import AspectRatio from "~/components/aspect-ratio";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import LockIcon from "~/icons/lock";
import PencilIcon from "~/icons/pencil";
import PhotoPlusIcon from "~/icons/photo-plus";
import TrashIcon from "~/icons/trash";
import { use_blog_banner_settings_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./banner-settings.module.scss";

const BlogBannerSettings = (): React.ReactElement => {
  const blog = use_blog_context();
  const toast = use_toast();
  const [banner_id, set_banner_id] = React.useState<string | null>(
    blog.banner_id
  );
  const [mutate_blog_banner_settings, { isLoading: is_loading }] =
    use_blog_banner_settings_mutation();
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
        "Are you sure you want to remove the banner? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current banner settings
   */
  const dispatch_banner_settings = React.useCallback(
    (banner_id?: string) => {
      mutate_blog_banner_settings({
        banner_id: banner_id || null,
        blog_id: blog.id
      })
        .unwrap()
        .then((res) => {
          blog.mutate({ banner_id: res.banner_id, banner_hex: res.banner_hex });
          set_banner_id(res.banner_id);
          toast(
            `Banner ${
              res.banner_id === null ? "removed" : "updated"
            } successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not update the banner")
        );
    },
    [mutate_blog_banner_settings, blog, toast]
  );

  return (
    <AspectRatio
      className={clsx(styles.x, styles["aspect-ratio"])}
      ratio={4.45}
    >
      {!blog.has_plus_features ? (
        <div
          className={clsx(
            css["flex-col"],
            css["flex-center"],
            css["full-h"],
            css["full-w"],
            styles.preview
          )}
        >
          <LockIcon />
          <Typography color={"muted"} level={"body3"}>
            Get Storiny+ to modify the banner
          </Typography>
        </div>
      ) : banner_id ? (
        <Image
          alt={""}
          className={clsx(styles.x, styles.banner)}
          hex={blog.banner_hex}
          img_key={blog.banner_id}
          slot_props={{
            image: {
              sizes: [
                `${BREAKPOINTS.up("desktop")} 680px`,
                `${BREAKPOINTS.up("mobile")} calc(100vw - 72px)`,
                "100vw"
              ].join(","),

              srcSet: [
                `${get_cdn_url(blog.banner_id, ImageSize.W_1440)} 1440w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_1200)} 1200w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_960)} 960w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_640)} 640w`,
                `${get_cdn_url(blog.banner_id, ImageSize.W_320)} 320w`
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
      {blog.has_plus_features && (
        <div className={clsx(css["flex-center"], styles["banner-actions"])}>
          <Gallery
            on_confirm={(asset): void => {
              set_banner_id(asset.key);
              dispatch_banner_settings(asset.key);
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
      )}
    </AspectRatio>
  );
};

export default BlogBannerSettings;
