// noinspection JSUnusedGlobalSymbols

import BlogContext from "@storiny/web/src/app/blog/[slug]/context";
import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

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
      <BlogContext.Provider
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
      </BlogContext.Provider>
    )
  ],
  args: {
    force_mount: true,
    style: {
      width: "310px",
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      marginLeft: "48px"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogLeftSidebar>;

export const Default: Story = {};
