// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "../Button";
import Banner from "./Banner";
import { BannerProps } from "./Banner.props";
import { useBanner } from "./useBanner";

const meta: Meta<typeof Banner> = {
  title: "Components/Banner",
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
        defaultValue: { summary: "" },
      },
      control: {
        type: "text",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

const BannerComponent = (props?: BannerProps) => {
  const banner = useBanner();

  return (
    <Button onClick={() => banner("This is a banner notification", props)}>
      Show banner
    </Button>
  );
};

export const Default: Story = {
  render: (args) => <BannerComponent {...args} />,
};

export const ColorInverted: Story = {
  ...Default,
  args: {
    color: "inverted",
  },
};

export const ColorLemon: Story = {
  ...Default,
  args: {
    color: "lemon",
  },
};

export const ColorRuby: Story = {
  ...Default,
  args: {
    color: "ruby",
  },
};

export const IconInfo: Story = {
  ...Default,
  args: {
    icon: "info",
  },
};

export const IconWarning: Story = {
  ...Default,
  args: {
    icon: "warning",
  },
};

export const IconError: Story = {
  ...Default,
  args: {
    icon: "error",
  },
};
