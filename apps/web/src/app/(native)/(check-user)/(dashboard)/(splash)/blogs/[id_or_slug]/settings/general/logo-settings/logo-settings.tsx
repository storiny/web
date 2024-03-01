import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Avatar from "~/components/avatar";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import Gallery from "~/entities/gallery";
import PencilIcon from "~/icons/pencil";
import TrashIcon from "~/icons/trash";
import { use_blog_logo_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./logo-settings.module.scss";

const BlogLogoSettings = (): React.ReactElement | null => {
  const blog = use_blog_context();
  const toast = use_toast();
  const [logo_id, set_logo_id] = React.useState<string | null>(blog.logo_id);
  const [mutate_blog_logo_settings, { isLoading: is_loading }] =
    use_blog_logo_settings_mutation();
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        decorator={<TrashIcon />}
        disabled={!logo_id || is_loading}
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
        set_logo_id(null);
        dispatch_logo_settings();
      },
      title: "Remove logo?",
      description:
        "Are you sure you want to remove the logo? This action cannot be undone."
    }
  );

  /**
   * Dispatches the current logo settings
   */
  const dispatch_logo_settings = React.useCallback(
    (logo_id?: string) => {
      mutate_blog_logo_settings({ logo_id: logo_id || null, blog_id: blog.id })
        .unwrap()
        .then((res) => {
          blog.mutate({
            logo_id: res.logo_id,
            logo_hex: res.logo_hex
          });
          set_logo_id(res.logo_id);
          toast(
            `Logo ${res.logo_id === null ? "removed" : "updated"} successfully`,
            "success"
          );
        })
        .catch((error) =>
          handle_api_error(error, toast, null, "Could not update the logo")
        );
    },
    [blog, mutate_blog_logo_settings, toast]
  );

  return (
    <div className={clsx(css["flex-col"], styles["logo-settings"])}>
      <div className={clsx(css["flex-center"], styles.header)}>
        <Avatar
          alt={""}
          avatar_id={blog.logo_id}
          className={clsx(styles.x, styles.logo)}
          hex={blog.logo_hex}
          label={blog.name}
          slot_props={{
            fallback: {
              className: clsx(styles.x, styles.fallback)
            }
          }}
        />
        <div className={css["flex-col"]}>
          <Gallery
            on_confirm={(asset): void => {
              set_logo_id(asset.key);
              dispatch_logo_settings(asset.key);
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
        1024 pixels in a square shape.
      </Typography>
    </div>
  );
};

export default BlogLogoSettings;
