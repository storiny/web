// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import NativeLayout from "../../layout";
import MembershipLayout from "../layout";
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
        <NativeLayout>
          <MembershipLayout>
            <Story />
          </MembershipLayout>
        </NativeLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
