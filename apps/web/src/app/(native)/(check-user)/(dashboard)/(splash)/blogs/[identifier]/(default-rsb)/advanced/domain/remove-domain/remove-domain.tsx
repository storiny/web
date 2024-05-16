"use client";

import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import { use_confirmation } from "~/components/confirmation";
import { use_toast } from "~/components/toast";
import WorldIcon from "~/icons/world";
import { use_remove_blog_domain_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

const RemoveDomain = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [remove_blog_domain, { isLoading: is_loading }] =
    use_remove_blog_domain_mutation();

  const handle_remove = (): void => {
    remove_blog_domain({ blog_id: blog.id })
      .unwrap()
      .then(() => {
        blog.mutate({ domain: null });
        toast("Successfully removed your domain", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove your domain")
      );
  };

  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        color={"ruby"}
        disabled={is_loading}
        onClick={open_confirmation}
        variant={"hollow"}
      >
        Remove ({blog.domain || ""})
      </Button>
    ),
    {
      on_confirm: handle_remove,
      decorator: <WorldIcon />,
      color: "ruby",
      title: "Remove domain?",
      description:
        "This blog will immediately be taken down from your custom domain."
    }
  );

  return element;
};

export default RemoveDomain;
