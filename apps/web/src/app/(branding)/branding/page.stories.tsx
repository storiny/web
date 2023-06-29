// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import BrandingLayout from "../layout";
import Branding from "./page";

const meta: Meta<typeof Branding> = {
  title: "pages/Branding",
  component: Branding,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Branding>;

export const Default: Story = {
  decorators: [
    (Story) =>
      renderWithState(
        <BrandingLayout>
          <Story />
        </BrandingLayout>,
        { ignorePrimitiveProviders: true }
      ),
  ],
};
