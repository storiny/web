// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import AuthLayout from "../../../(native)/(auth)/layout";
import StorybookBlogLayout from "../layout.storybook";
import VerifyLoginPage from "./client";

const meta: Meta<typeof VerifyLoginPage> = {
  title: "pages/blog/verify-login",
  component: VerifyLoginPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof VerifyLoginPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <AuthLayout>
            <Story />
          </AuthLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
