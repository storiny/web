import "server-only";

import { Status } from "@grpc/grpc-js/build/src/constants";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { Story } from "@storiny/types";
import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_story } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_doc_by_key } from "~/common/utils/get-doc-by-key";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";

import Component from "./component";
import RestrictedStory from "./restricted";

const Page = async ({
  params: { story_id_or_slug, slug }
}: {
  params: { slug: string; story_id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_valid_blog_slug(slug)) {
      not_found();
    }

    const user_id = await get_user();
    const story_response = await get_story({
      id_or_slug: story_id_or_slug,
      current_user_id: user_id || undefined
    });

    if (
      !story_response.user || // Sanity
      !story_response.blog || // Story is not published in a blog
      (typeof story_response.published_at === "undefined" &&
        typeof story_response.first_published_at === "undefined") || // Story was never published
      typeof story_response.deleted_at !== "undefined" // Delete story
    ) {
      not_found();
    }

    // Story unpubished
    if (
      typeof story_response.first_published_at !== "undefined" &&
      typeof story_response.published_at === "undefined"
    ) {
      return (
        <RestrictedStory type={"unpublished"} user={story_response.user} />
      );
    }

    // Redirect if the blog does not match
    if (
      story_response.blog.domain
        ? story_response.blog.domain !== slug
        : story_response.blog.slug !== slug
    ) {
      redirect(`${get_blog_url(story_response.blog)}/${story_response.slug}`);
    }

    if (
      !story_response.user.is_self &&
      story_response.user.is_blocked_by_user
    ) {
      story_response.user.rendered_bio = ""; // Hide bio

      return (
        <RestrictedStory type={"user-blocked"} user={story_response.user} />
      );
    }

    // Uint8Array needs to be converted into an untyped array so that it can be
    // safely serialized to JSON for client-side hydration. It is converted back
    // into a Uint8Array on the client side.
    const doc = Array.from(await get_doc_by_key(story_response.doc_key));

    return <Component doc={doc} story={story_response as Story} />;
  } catch (e) {
    const err_code = e?.code;

    // Redirect to storiny.com
    if (err_code === Status.NOT_FOUND) {
      redirect(`${process.env.NEXT_PUBLIC_WEB_URL}/${story_id_or_slug}`);
    }

    handle_exception(e);
  }
};

export { generateMetadata } from "./metadata";
export default Page;
