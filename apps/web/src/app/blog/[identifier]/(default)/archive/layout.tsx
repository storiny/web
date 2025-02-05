import "server-only";

import { clsx } from "clsx";
import { notFound as not_found } from "next/navigation";
import React from "react";

import { get_blog_archive } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";
import Main from "~/components/main";
import Typography from "~/components/typography";
import PageTitle from "~/entities/page-title";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import BlogContent from "../../content";
import ArchiveRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const BlogArchiveLayout = async ({
  params,
  children
}: {
  children: React.ReactNode;
  params: Promise<{ identifier: string }>;
}): Promise<React.ReactElement | undefined> => {
  try {
    const { identifier } = await params;

    if (!is_valid_blog_identifier(identifier)) {
      not_found();
    }

    const archive = await get_blog_archive({
      identifier
    });

    return (
      <React.Fragment>
        <Main>
          <BlogContent />
          <PageTitle
            back_button_href={"/"}
            className={clsx(styles["page-title"], css["no-sidenav"])}
          >
            Archive
          </PageTitle>
          {archive.story_count !== 0 && (
            <div
              className={clsx(
                css["full-bleed"],
                css["page-header"],
                css["with-page-title"],
                css["no-sidenav"],
                css.flex,
                styles.x,
                styles["status-header"]
              )}
            >
              <Typography level={"body2"}>
                A total of{" "}
                <span className={css["t-medium"]}>
                  {abbreviate_number(archive.story_count)}
                </span>{" "}
                {archive.story_count === 1 ? "story is" : "stories are"}{" "}
                published on this blog.
              </Typography>
            </div>
          )}
          {children}
        </Main>
        <ArchiveRightSidebar archive={archive} />
      </React.Fragment>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default BlogArchiveLayout;
