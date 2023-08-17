// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DefaultLayout from "../../../../layout";
import LegalLayout from "../../../layout";
import ImpersonationPolicy from "./client";

const meta: Meta<typeof ImpersonationPolicy> = {
  title: "pages/Legal/use-policies/impersonation",
  component: ImpersonationPolicy,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ImpersonationPolicy>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <LegalLayout>
            <Story />
          </LegalLayout>
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};
