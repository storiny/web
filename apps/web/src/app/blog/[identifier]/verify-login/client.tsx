"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_verify_blog_login_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

const VerifyLogin = (): React.ReactElement => {
  const blog = use_blog_context();
  const toast = use_toast();
  const router = use_app_router();
  const params = use_search_params();
  const [state, set_state] = React.useState<
    "loading" | "done" | "missing-token" | "invalid-token" | "error"
  >("loading");
  const [mutate_verification] = use_verify_blog_login_mutation();

  React.useEffect(() => {
    const token = params.get("token");
    const next_url = params.get("next-url");

    if (!token) {
      return set_state("missing-token");
    }

    mutate_verification({
      token,
      blog_id: blog.id
    })
      .unwrap()
      .then((res) => {
        if (res.result === "success") {
          set_state("done");
          router.replace(next_url || "/"); // Home page
          router.refresh(); // Refresh the state
        } else if (res.result === "invalid_token") {
          set_state("invalid-token");
        }
      })
      .catch((error) => {
        set_state("error");
        handle_api_error(error, toast, null, "Could not log you in");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog.id, mutate_verification, router, params]);

  return (
    <>
      <Typography as={"h1"} level={"h2"} style={{ textAlign: "center" }}>
        {state === "error"
          ? "Unable to log you in"
          : state === "invalid-token"
            ? "Invalid or expired login token"
            : state === "missing-token"
              ? "Missing login token"
              : "Logging you in…"}
      </Typography>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={2} />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        {state === "error" ||
        state === "missing-token" ||
        state === "invalid-token" ? (
          <Button
            as={NextLink}
            className={css["full-w"]}
            href={"/"}
            size={"lg"}
          >
            Home
          </Button>
        ) : (
          <Spinner />
        )}
      </div>
    </>
  );
};

export default VerifyLogin;
