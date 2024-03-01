"use client";

import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../../common/dashboard-group";
import DashboardTitle from "../../../../../common/dashboard-title";
import DashboardWrapper from "../../../../../common/dashboard-wrapper";

const BlogAppearanceSettingsClient = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();

  return (
    <React.Fragment>
      <DashboardTitle>Appearance</DashboardTitle>
      <DashboardWrapper>
        <DashboardGroup>
          <TitleBlock title={"Mark"}>
            Mark will be displayed on the navigation bar of your blog. We
            recommend using an image with a transparent background and checking
            if it has enough contrast with the banner image if you are using
            one.
            <br />
            <br />
            You can also upload a distinct mark for dark mode.
          </TitleBlock>
          <Spacer orientation={"vertical"} size={5} />
          --
        </DashboardGroup>
        <Divider />
        <DashboardGroup>
          <TitleBlock title={"Favicon"}>
            This will be displayed next to your blog&apos;s address by the
            browsers. Please upload a <span className={css["t-bold"]}>PNG</span>{" "}
            file with a minimum resolution of 64 pixels in a square shape.
          </TitleBlock>
        </DashboardGroup>
        <Divider />
        <DashboardGroup>
          <TitleBlock title={"Fonts"}>
            You can upload your own fonts to use for your blog. These will
            override Storiny&apos;s default fonts.
            <br />
            <br />
            The primary font is used for headings, the secondary font is used
            for body text, and the code font is used for inline code snippets
            and code blocks. We recommend using a display font as the primary
            font, a serif or sans-serif font as the secondary font, and a
            monospace font as the code font choice.
            <br />
            <br />
            Please upload the fonts in{" "}
            <span className={css["t-bold"]}>WOFF2</span> format.
          </TitleBlock>
        </DashboardGroup>
        <Divider />
        <DashboardGroup>
          <TitleBlock title={"Page layout"}>
            Choose how stories are displayed on your homepage.
          </TitleBlock>
        </DashboardGroup>
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
