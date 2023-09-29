// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../../../layout";
import LegalLayout from "../../../layout";
import ContentRemovalPolicy from "./client";

const meta: Meta<typeof ContentRemovalPolicy> = {
  title: "pages/Legal/policies/content-removal",
  component: ContentRemovalPolicy,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentRemovalPolicy>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <LegalLayout>
            <Story />
          </LegalLayout>
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
