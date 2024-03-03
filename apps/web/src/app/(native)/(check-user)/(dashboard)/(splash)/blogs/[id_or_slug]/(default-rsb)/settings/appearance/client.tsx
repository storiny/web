"use client";

import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";

import DashboardGroup from "../../../../../common/dashboard-group";
import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import BlogFaviconSettings from "./favicon";
import BlogFontsSettings from "./fonts";
import BlogMarkSettings from "./mark";
import PageLayoutSettings from "./page-layout";

const BlogAppearanceSettingsClient = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();

  return (
    <React.Fragment>
      <DashboardTitle>Appearance</DashboardTitle>
      <DashboardWrapper>
        <BlogMarkSettings />
        <Divider />
        <BlogFaviconSettings />
        <Divider />
        <BlogFontsSettings />
        <Divider />
        <PageLayoutSettings />
        <Divider />
        <DashboardGroup>
          <TitleBlock title={"Story layout"}>
            Choose how your stories appear to your readers. Choosing the minimal
            layout will hide the table of contents for the stories.
          </TitleBlock>
        </DashboardGroup>
        <Divider />
        <DashboardGroup>
          <TitleBlock title={"Default theme"}>
            Choose the default theme for your blog. Users can switch between a
            dark and a light theme.
          </TitleBlock>
        </DashboardGroup>
        <Divider />

        <DashboardGroup>
          <TitleBlock title={"Remove branding"}>
            Remove all Storiny branding from your blog.
          </TitleBlock>
        </DashboardGroup>
      </DashboardWrapper>
      <Spacer orientation={"vertical"} size={10} />
    </React.Fragment>
  );
};

export default BlogAppearanceSettingsClient;
