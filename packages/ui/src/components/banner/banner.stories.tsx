import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Banner from "./banner";
import BannerProvider from "./provider";

const meta: Meta<typeof Banner> = {
  title: "components/banner",
  component: Banner,
  tags: ["autodocs"],
  argTypes: {
    children: {
      name: "children",
      type: { name: "string", required: true },
      defaultValue: "",
      description: "The banner message.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "" }
      },
      control: {
        type: "text"
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  render: (args) => (
    <BannerProvider>
      <Banner open {...args} />
    </BannerProvider>
  )
};

export const ColorInverted: Story = {
  ...Default,
  args: {
    color: "inverted"
  }
};

export const ColorLemon: Story = {
  ...Default,
  args: {
    color: "lemon"
  }
};

export const ColorRuby: Story = {
  ...Default,
  args: {
    color: "ruby"
  }
};
