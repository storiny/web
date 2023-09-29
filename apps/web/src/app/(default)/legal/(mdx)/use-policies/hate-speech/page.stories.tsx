// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../../../layout";
import LegalLayout from "../../../layout";
import HateSpeechPolicy from "./client";

const meta: Meta<typeof HateSpeechPolicy> = {
  title: "pages/Legal/use-policies/hate-speech",
  component: HateSpeechPolicy,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof HateSpeechPolicy>;

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
