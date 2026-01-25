// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import BlogContextProvider from "../../../../../apps/web/src/common/context/blog";
import { MOCK_BLOGS } from "../../mocks";
import BlogLeftSidebar from "./blog-left-sidebar";

const meta: Meta<typeof BlogLeftSidebar> = {
  title: "layout/blog-left-sidebar",
  component: BlogLeftSidebar,
  parameters: {
    layout: "fullscreen"
  },
  decorators: [
    (Story): React.ReactElement => (
      <BlogContextProvider
        value={{
          ...MOCK_BLOGS[0],
          role: null
        }}
      >
        <div
          className={clsx(
            css["grid"],
            css["grid-container"],
            css["no-sidenav"]
          )}
        >
          <Story />
        </div>
      </BlogContextProvider>
    )
  ],
  args: {
    force_mount: true,
    style: {
      width: "310px",

      marginLeft: "48px"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogLeftSidebar>;

export const Default: Story = {};
