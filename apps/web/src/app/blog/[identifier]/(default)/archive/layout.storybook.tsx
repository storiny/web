import { clsx } from "clsx";
import React from "react";

import { GetBlogArchiveResponse } from "~/common/grpc";
import Main from "~/components/main";
import Typography from "~/components/typography";
import PageTitle from "~/entities/page-title";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import BlogContent from "../../content";
import ArchiveRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const StorybookBlogArchiveLayout = ({
  children,
  archive
}: {
  archive: GetBlogArchiveResponse;
  children: React.ReactNode;
}): React.ReactElement => (
  <React.Fragment>
    <Main>
      <BlogContent />
      <PageTitle back_button_href={"/"} className={styles["page-title"]}>
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
            {archive.story_count === 1 ? "story is" : "stories are"} published
            on this blog.
          </Typography>
        </div>
      )}
      {children}
    </Main>
    <ArchiveRightSidebar archive={archive} />
  </React.Fragment>
);

export default StorybookBlogArchiveLayout;
