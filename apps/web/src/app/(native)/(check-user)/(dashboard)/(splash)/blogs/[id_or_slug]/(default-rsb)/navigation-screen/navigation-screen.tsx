import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import SuspenseLoader from "~/common/suspense-loader";
import IconButton from "~/components/icon-button";
import NavigationItem from "~/components/navigation-item";
import NoSsr from "~/components/no-ssr";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import PageTitle from "~/entities/page-title";
import Persona from "~/entities/persona";
import ExternalLinkIcon from "~/icons/external-link";
import css from "~/theme/main.module.scss";

import { Group } from "../../../../common/left-sidebar";
import { BLOG_DASHBOARD_GROUPS } from "../../groups";
import { BlogDashboardSegment } from "../../types";
import styles from "./navigation-screen.module.scss";

// Group component

const GroupComponent = ({
  group
}: {
  group: Group<BlogDashboardSegment>;
}): React.ReactElement => {
  const blog = use_blog_context();
  return (
    <div className={clsx(css["flex-col"], styles["navigation-group"])}>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        {group.title}
      </Typography>
      <div className={clsx(css["flex-col"], styles["item-container"])}>
        {group.items.map((item) => (
          <React.Fragment key={item.value}>
            <NavigationItem
              as={NextLink}
              decorator={item.decorator}
              href={`/blogs/${blog.slug}/${item.value}`}
            >
              {item.title}
            </NavigationItem>
            <Separator className={css["hide-last"]} invert_margin />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const BlogDashboardNavigationScreen = (): React.ReactElement => {
  const blog = use_blog_context();
  const blog_url = get_blog_url(blog);

  return (
    <NoSsr fallback={<SuspenseLoader style={{ minHeight: "250px" }} />}>
      <PageTitle dashboard hide_back_button>
        Blog dashboard
      </PageTitle>
      {/* Page header */}
      <div
        className={clsx(
          css["flex-center"],
          css["full-bleed"],
          css["page-header"],
          css["dashboard-header"],
          css["with-page-title"]
        )}
      >
        <Persona
          avatar={{
            alt: "",
            avatar_id: blog.logo_id,
            label: blog.name,
            hex: blog.logo_hex,
            className: clsx(styles.x, styles.logo),
            slot_props: {
              fallback: {
                className: clsx(styles.x, styles.fallback)
              }
            }
          }}
          className={clsx(styles.x, styles.persona)}
          component_props={{
            primary_text: {
              className: css["ellipsis"]
            },
            secondary_text: {
              className: css["ellipsis"]
            }
          }}
          primary_text={blog.name}
          secondary_text={blog_url.replace("https://", "")}
          size={"lg"}
        />
        <Spacer />
        <IconButton
          aria-label={"Visit blog"}
          as={NextLink}
          auto_size
          href={blog_url}
          target={"_blank"}
          title={"Visit blog"}
          variant={"ghost"}
        >
          <ExternalLinkIcon />
        </IconButton>
      </div>
      <div className={clsx(css["flex-col"], styles["navigation-screen"])}>
        {BLOG_DASHBOARD_GROUPS.map((group) => (
          <GroupComponent group={group} key={group.title} />
        ))}
      </div>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={12} />
    </NoSsr>
  );
};

export default BlogDashboardNavigationScreen;
