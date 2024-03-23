// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import BrandingLayout from "../../layout";
import WithFooterLayout from "../layout";
import Membership from "./page";

const meta: Meta<typeof Membership> = {
  title: "pages/membership",
  component: Membership,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Membership>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <BrandingLayout>
          <WithFooterLayout>
            <Story />
          </WithFooterLayout>
        </BrandingLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
