import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import FileUploadIcon from "~/icons/file-upload";
import TrashIcon from "~/icons/trash";
import { use_blog_newsletter_splash_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../common/dashboard-group";
import styles from "./splash.module.scss";

const NewsletterSplashSettings = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [splash, set_splash] = React.useState<string | null>(
    blog.newsletter_splash_id
  );
  const [mutate_splash, { isLoading: is_loading }] =
    use_blog_newsletter_splash_settings_mutation();

  /**
   * Dispatches the current splash settings
   */
  const dispatch_splash_settings = React.useCallback(
    (splash_id?: string | null) => {
      mutate_splash({
        newsletter_splash_id: splash_id || null,
        blog_id: blog.id
      })
        .unwrap()
        .then((res) => {
          blog.mutate(res);
          set_splash(res.newsletter_splash_id);
          toast(
            `Newsletter splash ${
              res.newsletter_splash_id === null ? "removed" : "updated"
            } successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            null,
            "Could not update the newsletter splash"
          )
        );
    },
    [mutate_splash, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Splash"}>
        The custom splash image will be displayed on the newsletter page of your
        blog.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css.flex, styles.content)}>
        {blog.has_plus_features ? (
          <div
            className={clsx(css["flex-center"], css["flex-col"], styles.item)}
          >
            <Gallery
              on_confirm={(asset): void => {
                set_splash(asset.key);
                dispatch_splash_settings(asset.key);
              }}
            >
              <button
                aria-label={"Modify newsletter splash"}
                className={clsx(
                  css["flex-center"],
                  css["focusable"],
                  styles["drop-zone"],
                  is_loading && styles.disabled,
                  splash === null && styles.empty
                )}
                title={
                  splash === null
                    ? "Upload newsletter splash"
                    : "Modify newsletter splash"
                }
                type={"button"}
              >
                {is_loading ? (
                  <Spinner />
                ) : splash ? (
                  <Image
                    alt={"Newsletter splash image for the blog"}
                    className={styles.image}
                    hex={null}
                    img_key={splash}
                    size={ImageSize.W_320}
                  />
                ) : (
                  <FileUploadIcon />
                )}
              </button>
            </Gallery>
            <div className={clsx(css["flex-center"], styles.footer)}>
              <Typography color={"minor"} level={"body3"}>
                Splash image
              </Typography>
              {splash && (
                <React.Fragment>
                  <Divider orientation={"vertical"} />
                  <IconButton
                    aria-label={"Remove newsletter splash"}
                    disabled={is_loading}
                    onClick={(): void => {
                      set_splash(null);
                      dispatch_splash_settings(null);
                    }}
                    size={"xs"}
                    title={"Remove newsletter splash"}
                    variant={"ghost"}
                  >
                    <TrashIcon />
                  </IconButton>
                </React.Fragment>
              )}
            </div>
          </div>
        ) : (
          <Button
            as={NextLink}
            auto_size
            className={css["fit-w"]}
            decorator={<PlusBadge no_stroke />}
            href={"/membership"}
            target={"_blank"}
            variant={"hollow"}
          >
            This is a plus feature
          </Button>
        )}
      </div>
    </DashboardGroup>
  );
};

export default NewsletterSplashSettings;
