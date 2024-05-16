"use client";

import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import Link from "~/components/link";
import Main from "~/components/main";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import TitleBlock from "~/entities/title-block";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../../../common/dashboard-group";
import DashboardTitle from "../../../../common/dashboard-title";
import DashboardWrapper from "../../../../common/dashboard-wrapper";
import BannerSettings from "./banner-settings";
import DeleteAction from "./delete-action";
import BlogGeneralForm from "./general-form";
import LogoSettings from "./logo-settings";
import AccountProfileRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";
import VisibilityAction from "./visibility-action";

const GeneralSettingsClient = (): React.ReactElement => {
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const blog = use_blog_context();

  return (
    <React.Fragment>
      <Main>
        <DashboardTitle>General</DashboardTitle>
        <BannerSettings />
        <DashboardWrapper>
          {is_smaller_than_desktop && (
            <DashboardGroup>
              <Typography as={"h2"} level={"h4"}>
                Logo
              </Typography>
              <Spacer orientation={"vertical"} size={1.5} />
              <div className={styles["logo-settings-wrapper"]}>
                <LogoSettings />
              </div>
            </DashboardGroup>
          )}
          <DashboardGroup>
            <BlogGeneralForm />
          </DashboardGroup>
          <Divider />
          <DashboardGroup>
            <TitleBlock title={"Visibility"}>
              You can choose to hide your blog from the Storiny network. If you
              choose to do so, your blog will not appear in search results or
              digest emails.
            </TitleBlock>
            <Spacer orientation={"vertical"} size={4.5} />
            <VisibilityAction />
          </DashboardGroup>
          <Divider />
          <DashboardGroup>
            <TitleBlock title={"Connections"}>
              You can add a link to your external social media account or
              website on the{" "}
              <Link
                href={`/blogs/${blog.slug}/settings/connections`}
                underline={"always"}
              >
                connections page
              </Link>
              , and it will be displayed on the home-page of your blog.
            </TitleBlock>
          </DashboardGroup>
          {blog.role === "owner" && (
            <React.Fragment>
              <Divider />
              <DashboardGroup>
                <TitleBlock
                  component_props={{
                    title: {
                      style: { color: "var(--ruby-500)" }
                    }
                  }}
                  title={"Danger zone"}
                >
                  Deleting this blog will immediately remove all editors and
                  writers. However, the stories published in this blog will not
                  be deleted; they will still be available on their
                  authors&apos; profile pages if they are public. This action is
                  instant and permanent, and there is no way to recover your
                  blog after it&apos;s deleted.
                </TitleBlock>
                <Spacer orientation={"vertical"} size={4.5} />
                <DeleteAction />
              </DashboardGroup>
            </React.Fragment>
          )}
        </DashboardWrapper>
        <Spacer orientation={"vertical"} size={10} />
      </Main>
      <AccountProfileRightSidebar />
    </React.Fragment>
  );
};

export default GeneralSettingsClient;
