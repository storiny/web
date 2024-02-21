// noinspection JSUnusedGlobalSymbols

import BlogContext from "@storiny/web/src/app/(blog)/context";
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
          rsb_items_label: "Items label",
          rsb_items: [
            {
              primary_text: "Item 1",
              secondary_text: "$10",
              id: "1",
              target: "/item-1",
              priority: 1,
              icon: "NFs6dRTBgaM.jpg"
            },
            {
              primary_text: "Item 2",
              secondary_text: "$5",
              id: "2",
              target: "/item-2",
              priority: 2,
              icon: "DLz8QHA7pFUjpg.jpg"
            },
            {
              primary_text: "Item 3",
              secondary_text: "$14",
              id: "3",
              target: "/item-3",
              priority: 3,
              icon: "jNpvVRvFcrI.jpg"
            }
          ],
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
