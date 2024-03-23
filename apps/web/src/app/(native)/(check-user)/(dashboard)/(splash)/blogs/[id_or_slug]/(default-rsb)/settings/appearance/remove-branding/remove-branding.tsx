import NextLink from "next/link";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import { PlusBadge } from "~/entities/badges";
import TitleBlock from "~/entities/title-block";
import { use_blog_branding_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";

const BlogBrandingSettings = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [mutate_blog_branding, { isLoading: is_loading }] =
    use_blog_branding_settings_mutation();

  /**
   * Dispatches the current branding settings
   */
  const dispatch_branding_settings = React.useCallback(
    (hide_storiny_branding: boolean) => {
      mutate_blog_branding({
        hide_storiny_branding,
        blog_id: blog.id
      })
        .unwrap()
        .then(() => {
          blog.mutate({ hide_storiny_branding });
          toast("Branding settings updated", "success");
        })
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            null,
            "Could not update the branding settings"
          )
        );
    },
    [mutate_blog_branding, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Remove branding"}>
        Remove all Storiny branding from your blog.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4} />
      {blog.has_plus_features ? (
        <Button
          auto_size
          check_auth
          className={css["fit-w"]}
          loading={is_loading}
          onClick={(): void =>
            dispatch_branding_settings(!blog.hide_storiny_branding)
          }
          variant={blog.hide_storiny_branding ? "rigid" : "hollow"}
        >
          {blog.hide_storiny_branding
            ? "Show Storiny branding"
            : "Remove Storiny branding"}
        </Button>
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
    </DashboardGroup>
  );
};

export default BlogBrandingSettings;
