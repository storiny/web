// noinspection JSUnusedGlobalSymbols

import BlogContext from "@storiny/web/src/common/context/blog";
import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import { MOCK_BLOGS } from "../../mocks";
import BlogNavbar from "./blog-navbar";

const meta: Meta<typeof BlogNavbar> = {
  title: "layout/blog-navbar",
  component: BlogNavbar,
  decorators: [
    (Story): React.ReactElement => (
      <BlogContext.Provider
        value={{
          ...MOCK_BLOGS[0],
          mark_light: "Gj7gaDpXto8jpg.jpg",
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
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogNavbar>;

export const Default: Story = {};

export const Transparent: Story = {
  decorators: [
    (Story): React.ReactElement => (
      <BlogContext.Provider
        value={{
          ...MOCK_BLOGS[0],
          banner_id: "0",
          banner_hex: "0",
          mark_light: "Gj7gaDpXto8jpg.jpg",
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
  ]
};
