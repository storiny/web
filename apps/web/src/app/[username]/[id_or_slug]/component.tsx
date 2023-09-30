import Editor from "@storiny/editor";
import { ImageSize, StoryAgeRestriction, StoryLicense } from "@storiny/shared";
import { CATEGORY_LABEL_MAP } from "@storiny/shared/src/constants/category-icon-map";
import { LICENSE_LABEL_MAP } from "@storiny/shared/src/constants/license-icon-map";
import { Story } from "@storiny/types";
import { clsx } from "clsx";
import { decompressSync as decompress_sync } from "fflate";
import React from "react";
import { Graph } from "schema-dts";

import SplashScreen from "../../../../../../packages/ui/src/layout/splash-screen";
import { get_cdn_url } from "../../../../../../packages/ui/src/utils/get-cdn-url";

interface Props {
  doc: Array<number>;
  story: Story;
}

const CC_LICENSE_DOC_MAP: Record<
  Exclude<
    StoryLicense,
    | typeof StoryLicense.UNSPECIFIED
    | typeof StoryLicense.UNRECOGNIZED
    | typeof StoryLicense.RESERVED
  >,
  string
> = {
  [StoryLicense.CC_ZERO /*    */]:
    "https://creativecommons.org/publicdomain/zero/1.0",
  [StoryLicense.CC_BY /*      */]:
    "https://creativecommons.org/licenses/by/4.0",
  [StoryLicense.CC_BY_SA /*   */]:
    "https://creativecommons.org/licenses/by-sa/4.0",
  [StoryLicense.CC_BY_ND /*   */]:
    "https://creativecommons.org/licenses/by-nd/4.0",
  [StoryLicense.CC_BY_NC /*   */]:
    "https://creativecommons.org/licenses/by-nc/4.0",
  [StoryLicense.CC_BY_NC_SA /**/]:
    "https://creativecommons.org/licenses/by-nc-sa/4.0",
  [StoryLicense.CC_BY_NC_ND /**/]:
    "https://creativecommons.org/licenses/by-nc-nd/4.0"
};

const generate_json_ld = (story: Props["story"]): Graph => ({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      alternateName: "Share your story.",
      image: {
        "@type": "ImageObject",
        height: 128 as unknown as string,
        url: get_cdn_url("web-assets/brand/logos/plain/logo", ImageSize.W_128),
        width: 128 as unknown as string
      },
      name: "Storiny",
      url: process.env.NEXT_PUBLIC_WEB_URL
    },
    {
      "@type": "BlogPosting",
      headline: `${story.seo_title || story.title} — Storiny`,
      name: `${story.seo_title || story.title} — Storiny`,
      description: story.seo_description || story.description || undefined,
      identifier: story.id,
      dateCreated: story.created_at,
      datePublished: story.published_at!,
      dateModified: story.edited_at || undefined,
      url: `${process.env.NEXT_PUBLIC_WEB_URL}/${
        story.user?.username || "story"
      }/${story.slug}`,
      discussionUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/${
        story.user?.username || "story"
      }/${story.slug}#auxiliary-content`,
      // TODO: Replace with dynamic image
      image: story.splash_id
        ? {
            "@type": "ImageObject",
            height: 630 as unknown as string,
            url: get_cdn_url(story.splash_id, ImageSize.W_64),
            width: 1200 as unknown as string
          }
        : undefined,
      commentCount: story.stats.comment_count,
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
        "@id": `${process.env.NEXT_PUBLIC_WEB_URL}/${
          story.user?.username || "story"
        }/${story.slug}`,
        "@type": "WebPage"
      },
      publisher: {
        "@type": "Organization",
        logo: {
          "@type": "ImageObject",
          height: 128 as unknown as string,
          url: get_cdn_url(
            "web-assets/brand/logos/plain/logo",
            ImageSize.W_128
          ),
          width: 128 as unknown as string
        },
        name: "Storiny",
        url: process.env.NEXT_PUBLIC_WEB_URL
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
    }
  ]
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const JsonLD = ({ story }: Props): React.ReactElement => {
  const json_ld = generate_json_ld(story);
  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json_ld) }}
      type="application/ld+json"
    />
  );
};

const Component = (props: Props): React.ReactElement => {
  const { story, doc } = props;
  return (
    <div className={clsx("grid", "grid-container", "dashboard", "no-sidenav")}>
      <JsonLD {...props} />
      <Editor
        doc_id={story.id}
        initial_doc={decompress_sync(Uint8Array.from(doc))}
        read_only
        role={"viewer"}
        story={story}
      />
      <SplashScreen />
    </div>
  );
};

export default Component;
