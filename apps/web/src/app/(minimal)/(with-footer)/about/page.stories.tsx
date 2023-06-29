// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import BrandingLayout from "../../layout";
import WithFooterLayout from "../layout";
import About from "./page";

const meta: Meta<typeof About> = {
  title: "pages/About",
  component: About,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof About>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <BrandingLayout>
          <WithFooterLayout>
            <Story />
          </WithFooterLayout>
        </BrandingLayout>,
        { ignorePrimitiveProviders: true }
      ),
  ],
};
