"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";

import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";
import BlogFaviconSettings from "./favicon";
import BlogFontsSettings from "./fonts";
import BlogMarkSettings from "./mark";
import PageLayoutSettings from "./page-layout";
import BlogBrandingSettings from "./remove-branding";
import StoryLayoutSettings from "./story-layout";
import BlogThemeSettings from "./theme";

const BlogAppearanceSettingsClient = (): React.ReactElement => (
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
      <StoryLayoutSettings />
      <Divider />
      <BlogThemeSettings />
      <Divider />
      <BlogBrandingSettings />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default BlogAppearanceSettingsClient;
