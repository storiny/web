// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import BrandingLayout from "../layout";
import Branding from "./page";

const meta: Meta<typeof Branding> = {
  title: "pages/branding",
  component: Branding,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Branding>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <BrandingLayout>
          <Story />
        </BrandingLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
