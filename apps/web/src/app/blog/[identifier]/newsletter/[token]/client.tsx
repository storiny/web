"use client";

import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import CheckIcon from "~/icons/check";
import css from "~/theme/main.module.scss";

interface Props {
  is_valid: boolean;
}

const Client = (props: Props): React.ReactElement => {
  const { is_valid } = props;
  const blog = use_blog_context();
  const blog_url = get_blog_url(blog);

  return is_valid ? (
    <React.Fragment>
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      <Typography
        className={css["flex-center"]}
        level={"body2"}
        style={{ gap: "8px" }}
      >
        <CheckIcon size={16} />
        You have subscribed to this newsletter
      </Typography>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <Divider />
      <Spacer orientation={"vertical"} size={3} />
      <Typography level={"body2"}>
        This subscription request is either invalid or has expired.{" "}
        <Link href={`${blog_url}/newsletter`} underline={"always"}>
          Try subscribing again
        </Link>
        .
      </Typography>
    </React.Fragment>
  );
};

export default Client;
