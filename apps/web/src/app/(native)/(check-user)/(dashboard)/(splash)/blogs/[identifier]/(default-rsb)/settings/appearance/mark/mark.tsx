import { ImageSize } from "@storiny/shared";
import { Blog } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import FileUploadIcon from "~/icons/file-upload";
import TrashIcon from "~/icons/trash";
import { use_blog_mark_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "./mark.module.scss";

const BlogMarkSettings = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [mark, set_mark] = React.useState<
    Pick<Blog, "mark_light" | "mark_dark">
  >({
    mark_dark: blog.mark_dark,
    mark_light: blog.mark_light
  });
  const [mutate_mark_settings, { isLoading: is_loading }] =
    use_blog_mark_settings_mutation();

  /**
   * Dispatches the current mark settings
   */
  const dispatch_mark_settings = React.useCallback(
    (type: "dark" | "light", mark_id?: string | null) => {
      mutate_mark_settings({
        mark_id: mark_id || null,
        type,
        blog_id: blog.id
      })
        .unwrap()
        .then((res) => {
          blog.mutate(res);
          set_mark(res);
          toast(
            `Mark ${
              res[type === "dark" ? "mark_dark" : "mark_light"] === null
                ? "removed"
                : "updated"
            } successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not update the mark")
        );
    },
    [mutate_mark_settings, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Mark"}>
        Mark will be displayed on the navigation bar of your blog. We recommend
        using an image that is exactly 28 pixels tall with a transparent
        background and checking if it has enough contrast with the banner image
        if you are using one.
        <br />
        <br />
        You can also upload a distinct mark for dark mode.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css.flex, styles.content)}>
        {(["light", "dark"] as const).map((mode) => (
          <div
            className={clsx(css["flex-center"], css["flex-col"], styles.item)}
            key={mode}
          >
            <Gallery
              on_confirm={(asset): void => {
                set_mark((prev_state) => ({
                  ...prev_state,
                  [`mark_${mode}`]: asset.key
                }));
                dispatch_mark_settings(mode, asset.key);
              }}
            >
              <button
                aria-label={`Modify mark for ${mode} mode`}
                className={clsx(
                  css["flex-center"],
                  css["focusable"],
                  styles["drop-zone"],
                  is_loading && styles.disabled,
                  mark[`mark_${mode}`] === null && styles.empty
                )}
                title={
                  mark[`mark_${mode}`] === null ? "Upload mark" : "Modify mark"
                }
                type={"button"}
              >
                {is_loading ? (
                  <Spinner />
                ) : mark[`mark_${mode}`] ? (
                  <Image
                    alt={`Mark for ${mode} mode`}
                    className={styles.image}
                    hex={null}
                    img_key={mark[`mark_${mode}`]}
                    size={ImageSize.W_640}
                  />
                ) : (
                  <FileUploadIcon />
                )}
              </button>
            </Gallery>
            <div className={clsx(css["flex-center"], styles.footer)}>
              <Typography color={"minor"} level={"body3"}>
                Mark for {mode} mode
              </Typography>
              {mark[`mark_${mode}`] && (
                <React.Fragment>
                  <Divider orientation={"vertical"} />
                  <IconButton
                    aria-label={"Remove mark"}
                    disabled={is_loading}
                    onClick={(): void => {
                      set_mark((prev_state) => ({
                        ...prev_state,
                        [`mark_${mode}`]: null
                      }));
                      dispatch_mark_settings(mode, null);
                    }}
                    size={"xs"}
                    title={"Remove mark"}
                    variant={"ghost"}
                  >
                    <TrashIcon />
                  </IconButton>
                </React.Fragment>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardGroup>
  );
};

export default BlogMarkSettings;
