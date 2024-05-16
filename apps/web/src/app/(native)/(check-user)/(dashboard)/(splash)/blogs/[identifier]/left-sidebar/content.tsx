"use client";

import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import clsx from "clsx";
import { useSelectedLayoutSegments as use_selected_layout_segments } from "next/navigation";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Link from "~/components/link";
import ScrollArea from "~/components/scroll-area";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import Tabs from "~/components/tabs";
import TabsList from "~/components/tabs-list";
import Persona from "~/entities/persona";
import ChevronIcon from "~/icons/chevron";
import css from "~/theme/main.module.scss";

import {
  GroupComponent,
  LeftSidebarFooter
} from "../../../common/left-sidebar";
import common_styles from "../../../common/left-sidebar/left-sidebar.module.scss";
import { BLOG_DASHBOARD_GROUPS } from "../groups";
import { BlogDashboardSegment } from "../types";
import styles from "./left-sidebar.module.scss";

const SuspendedBlogDashboardLeftSidebarContent = (): React.ReactElement => {
  const segments = use_selected_layout_segments();
  const blog = use_blog_context();
  const blog_url = get_blog_url(blog);

  const current_segment = React.useMemo(() => {
    const next_segments = segments;

    // Remove (default-rsb) layout chunk
    const index = next_segments.indexOf("(default-rsb)");

    if (index > -1) {
      next_segments.splice(index, 1);
    }

    return next_segments.slice(-2).join("/");
  }, [segments]);

  React.useEffect(() => {
    // Scroll selected segment tab into view on mount
    const current_segment_element = document.getElementById(current_segment);
    if (current_segment_element) {
      current_segment_element.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    }
  }, [current_segment]);

  return (
    <div className={clsx(css["flex-col"], common_styles["left-sidebar"])}>
      <div className={clsx(css["flex-col"], common_styles.content)}>
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
          className={clsx(common_styles.x, common_styles.persona)}
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
        <Link
          className={clsx(
            css["fit-w"],
            css["flex-center"],
            styles.x,
            styles["user-dashboard-link"]
          )}
          href={"/me"}
          level={"body2"}
        >
          <ChevronIcon
            rotation={270}
            style={{ "--icon-size": "14px" } as React.CSSProperties}
          />
          Your account
        </Link>
        <Separator />
      </div>
      <ScrollArea
        className={clsx(common_styles.x, common_styles.scroller)}
        slot_props={{
          viewport: {
            tabIndex: -1,
            className: clsx(
              css["flex"],
              common_styles.x,
              common_styles.viewport
            )
          },
          scrollbar: {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            style: { zIndex: 1, backgroundColor: "transparent" }
          }
        }}
      >
        <Tabs
          activationMode={"manual"}
          className={clsx(css["full-w"], css["fit-h"])}
          orientation={"vertical"}
          role={undefined}
          value={current_segment}
        >
          <TabsList
            aria-orientation={undefined}
            as={"nav"}
            className={clsx(
              css["full-w"],
              common_styles.x,
              common_styles["tabs-list"]
            )}
            loop={false}
            role={undefined}
          >
            {BLOG_DASHBOARD_GROUPS.map((group) => (
              <GroupComponent<BlogDashboardSegment>
                group={group}
                href_prefix={`blogs/${blog.domain || blog.slug}`}
                key={group.title}
                should_render={(item): boolean =>
                  !(item.metadata?.owner_only && blog.role !== "owner")
                }
              />
            ))}
          </TabsList>
        </Tabs>
        <Spacer orientation={"vertical"} size={2} />
        <LeftSidebarFooter />
      </ScrollArea>
    </div>
  );
};

export default SuspendedBlogDashboardLeftSidebarContent;
