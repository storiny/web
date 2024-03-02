import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import FileUploadIcon from "~/icons/file-upload";
import TrashIcon from "~/icons/trash";
import { use_blog_favicon_settings_mutation } from "~/redux/features/api/endpoints/me/blogs/settings/appearance/favicon";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "./favicon.module.scss";

const BlogFaviconSettings = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [favicon, set_favicon] = React.useState<string | null>(blog.favicon);
  const [mutate_favicon_settings, { isLoading: is_loading }] =
    use_blog_favicon_settings_mutation();

  /**
   * Dispatches the current favicon settings
   */
  const dispatch_favicon_settings = React.useCallback(
    (favicon?: string | null) => {
      mutate_favicon_settings({
        favicon: favicon || null,
        blog_id: blog.id
      })
        .unwrap()
        .then((res) => {
          blog.mutate(res);
          set_favicon(res.favicon);
          toast(
            `Favicon ${
              res.favicon === null ? "removed" : "updated"
            } successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not update the favicon")
        );
    },
    [mutate_favicon_settings, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Favicon"}>
        This will be displayed next to your blog&apos;s address by the browsers.
        Please upload a <span className={css["t-bold"]}>PNG</span> file with a
        minimum resolution of 64 pixels in a square shape.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css.flex, styles.content)}>
        <div className={clsx(css["flex-center"], css["flex-col"], styles.item)}>
          <Gallery
            on_confirm={(asset): void => {
              set_favicon(asset.key);
              dispatch_favicon_settings(asset.key);
            }}
          >
            <button
              aria-label={"Modify favicon"}
              className={clsx(
                css["flex-center"],
                css["focusable"],
                styles["drop-zone"],
                is_loading && styles.disabled,
                favicon === null && styles.empty
              )}
              title={favicon === null ? "Upload favicon" : "Modify favicon"}
              type={"button"}
            >
              {favicon ? (
                <Image
                  alt={"Favicon image for the blog"}
                  className={styles.image}
                  hex={null}
                  img_key={favicon}
                  size={ImageSize.W_64}
                />
              ) : (
                <FileUploadIcon />
              )}
            </button>
          </Gallery>
          <div className={clsx(css["flex-center"], styles.footer)}>
            <Typography color={"minor"} level={"body3"}>
              Favicon
            </Typography>
            {favicon && (
              <React.Fragment>
                <Divider orientation={"vertical"} />
                <IconButton
                  aria-label={"Remove favicon"}
                  disabled={is_loading}
                  onClick={(): void => {
                    set_favicon(null);
                    dispatch_favicon_settings(null);
                  }}
                  size={"xs"}
                  title={"Remove favicon"}
                  variant={"ghost"}
                >
                  <TrashIcon />
                </IconButton>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </DashboardGroup>
  );
};

export default BlogFaviconSettings;
