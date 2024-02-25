import "server-only";

import { notFound as not_found } from "next/navigation";
import React from "react";

import { get_blog_archive } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { is_valid_blog_slug } from "~/common/utils";

import Component from "./component";

const Page = async ({
  params: { slug }
}: {
  params: { slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_valid_blog_slug(slug)) {
      not_found();
    }

    const archive = await get_blog_archive({
      slug
    });

    return <Component archive={archive} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
