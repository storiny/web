// noinspection JSUnusedGlobalSymbols

import BlogContext from "@storiny/web/src/common/context/blog";
import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import { MOCK_BLOGS } from "../../mocks";
import BlogRightSidebar from "./blog-right-sidebar";

const meta: Meta<typeof BlogRightSidebar> = {
  title: "layout/blog-right-sidebar",
  component: BlogRightSidebar,
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
      marginRight: "48px"
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogRightSidebar>;

export const Default: Story = {};
