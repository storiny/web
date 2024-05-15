import NextLink from "next/link";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import { use_toast } from "~/components/toast";
import { PlusBadge } from "~/entities/badges";
import { use_blog_visibility_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

const VisibilityAction = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [mutate_blog_visibility, { isLoading: is_loading }] =
    use_blog_visibility_mutation();

  const handle_submit = (hidden: boolean): void => {
    mutate_blog_visibility({
      hidden,
      blog_id: blog.id
    })
      .unwrap()
      .then(() => {
        blog.mutate({ is_external: hidden });
        toast("Blog visibility updated", "success");
      })
      .catch((error) => {
        handle_api_error(
          error,
          toast,
          null,
          "Could not update the blog visibility"
        );
      });
  };

  return blog.has_plus_features ? (
    <Button
      auto_size
      check_auth
      className={css["fit-w"]}
      loading={is_loading}
      onClick={(): void => handle_submit(!blog.is_external)}
      variant={blog.is_external ? "rigid" : "hollow"}
    >
      {blog.is_external ? "Unhide this blog" : "Hide this blog"}
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
  );
};

export default VisibilityAction;
