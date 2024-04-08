"use client";

import Editor from "@storiny/editor";
import { ImageSize, StoryAgeRestriction, StoryLicense } from "@storiny/shared";
import { CATEGORY_LABEL_MAP } from "@storiny/shared/src/constants/category-icon-map";
import { LICENSE_LABEL_MAP } from "@storiny/shared/src/constants/license-icon-map";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { Story } from "@storiny/types";
import { clsx } from "clsx";
import { decompressSync as decompress_sync } from "fflate";
import React from "react";
import { BlogPosting, WithContext } from "schema-dts";

import { BlogContextValue, use_blog_context } from "~/common/context/blog";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { CC_LICENSE_DOC_MAP } from "../../../(native)/[username]/[id_or_slug]/component";

interface Props {
  blog: BlogContextValue;
  doc: Array<number>;
  story: Story;
}

const generate_json_ld = ({
  story,
  blog
}: Pick<Props, "story" | "blog">): WithContext<BlogPosting> => {
  const blog_url = get_blog_url(blog);
  return {
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: `${story.seo_title || story.title} — ${blog.name}`,
    name: `${story.seo_title || story.title} — ${blog.name}`,
    description: story.seo_description || story.description || undefined,
    identifier: story.id,
    dateCreated: story.created_at,
    datePublished: story.published_at!,
    dateModified: story.edited_at || undefined,
    url: `${blog_url}/${story.slug}`,
    discussionUrl: `${blog_url}/${story.slug}#auxiliary-content`,
    image: {
      "@type": "ImageObject",
      height: 630 as unknown as string,
      url: story.preview_image
        ? get_cdn_url(story.preview_image, ImageSize.W_1440)
        : `${process.env.NEXT_PUBLIC_OG_SERVER_URL}/stories/${story.id}`,
      width: 1200 as unknown as string
    },
    commentCount: story.comment_count,
    wordCount: story.word_count,
    author: {
      "@type": "Person",
      alternateName: `@${story.user?.username}`,
      identifier: story.user_id,
      image: story.user?.avatar_id
        ? {
            "@type": "ImageObject",
            height: 64 as unknown as string,
            url: get_cdn_url(story.user.avatar_id, ImageSize.W_64),
            width: 64 as unknown as string
          }
        : undefined,
      name: story.user?.name,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${story.user?.username}`
    },
    contributor: (story.contributors || []).map((user) => ({
      "@type": "Person",
      alternateName: `@${user.username}`,
      identifier: user.id,
      image: user.avatar_id
        ? {
            "@type": "ImageObject",
            height: 64 as unknown as string,
            url: get_cdn_url(user.avatar_id, ImageSize.W_64),
            width: 64 as unknown as string
          }
        : undefined,
      name: user.name,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${user.username}`
    })),
    genre: CATEGORY_LABEL_MAP[story.category],
    license: (
      [
        StoryLicense.UNRECOGNIZED,
        StoryLicense.UNSPECIFIED,
        StoryLicense.RESERVED
      ] as StoryLicense[]
    ).includes(story.license)
      ? undefined
      : CC_LICENSE_DOC_MAP[story.license],
    keywords: story.tags.map(({ name }) => name),
    isFamilyFriendly: story.age_restriction !== StoryAgeRestriction.RATED,
    mainEntityOfPage: {
      "@id": `${blog_url}/${story.slug}`,
      "@type": "WebPage"
    },
    publisher: {
      "@type": "Organization",
      logo: blog.logo_id
        ? {
            "@type": "ImageObject",
            height: 128 as unknown as string,
            url: get_cdn_url(blog.logo_id, ImageSize.W_128),
            width: 128 as unknown as string
          }
        : undefined,
      name: blog.name,
      url: blog_url
    },
    ...(!(
      [
        StoryLicense.UNRECOGNIZED,
        StoryLicense.UNSPECIFIED,
        StoryLicense.CC_ZERO
      ] as StoryLicense[]
    ).includes(story.license)
      ? {
          copyrightNotice: `License – ${LICENSE_LABEL_MAP[story.license]}`,
          copyrightHolder: {
            "@type": "Person",
            alternateName: `@${story.user?.username}`,
            identifier: story.user_id,
            name: story.user?.name,
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/${story.user?.username}`
          },
          copyrightYear: new Date(story.created_at).getFullYear()
        }
      : {})
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  };
};

const JsonLD = (props: Props): React.ReactElement => {
  const json_ld = generate_json_ld(props);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
      type="application/ld+json"
    />
  );
};

const Component = (props: Omit<Props, "blog">): React.ReactElement => {
  const { story, doc } = props;
  const blog = use_blog_context();

  return (
    <div
      className={clsx(
        css["grid"],
        css["grid-container"],
        css["dashboard"],
        css["no-sidenav"]
      )}
    >
      <JsonLD {...props} blog={blog} />
      {blog.is_story_minimal_layout && (
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-lsb="true"],
            [data-rsb="true"] {
              visibility: hidden !important;
              pointer-events: none;
            }`
          }}
        />
      )}
      <Editor
        doc_id={story.id}
        initial_doc={decompress_sync(Uint8Array.from(doc))}
        read_only
        role={"reader"}
        story={story}
      />
      <SplashScreen />
    </div>
  );
};

export default Component;
