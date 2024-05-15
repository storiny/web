// noinspection JSUnusedGlobalSymbols

import { GetBlogArchiveResponse } from "@storiny/proto/dist/blog_def/v1/def";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "../../layout.storybook";
import DefaultBlogLayout from "../layout";
import StorybookBlogArchiveLayout from "./layout.storybook";
import Archive from "./page";

const MOCK_RESPONSE: GetBlogArchiveResponse = {
  story_count: 14,
  timeline: [
    { year: 2024, active_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { year: 2023, active_months: [5, 12] },
    { year: 2022, active_months: [1, 3, 4, 9] },
    { year: 2021, active_months: [1, 2, 3, 4, 5, 10, 11, 12] }
  ]
};

const meta: Meta<typeof Archive> = {
  title: "pages/blog/archive",
  component: Archive,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Archive>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <DefaultBlogLayout>
            <StorybookBlogArchiveLayout archive={MOCK_RESPONSE}>
              <Story />
            </StorybookBlogArchiveLayout>
          </DefaultBlogLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
