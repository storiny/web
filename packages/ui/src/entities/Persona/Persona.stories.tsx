// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Persona from "./Persona";

const meta: Meta<typeof Persona> = {
  title: "Entities/Persona",
  component: Persona,
  args: { size: "md" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Persona>;

export const Default: Story = {
  args: {
    primaryText: "Primary text",
    secondaryText: "Secondary text",
    avatar: {
      alt: "Test avatar",
      src: "/images/avatars/louie.png",
      hex: "d3b4ac",
    },
  },
};

export const MultipleAvatars: Story = {
  args: {
    ...Default.args,
    avatar: [
      {
        alt: "First test avatar",
        src: "/images/avatars/louie.png",
        hex: "d3b4ac",
      },
      {
        alt: "Second test avatar",
        src: "/images/avatars/kevin.png",
        hex: "7da110",
      },
      {
        alt: "Third test avatar",
        src: "/images/avatars/oscar.png",
        hex: "acc5d3",
      },
    ],
  },
};

export const WithoutSecondaryText: Story = {
  args: {
    ...Default.args,
    secondaryText: undefined,
  },
};

export const SizeLG: Story = {
  args: {
    ...Default.args,
    size: "lg",
  },
};

export const SizeMD: Story = {
  args: {
    ...Default.args,
    size: "md",
  },
};

export const SizeSM: Story = {
  args: {
    ...Default.args,
    size: "sm",
  },
};

export const SizeXS: Story = {
  args: {
    ...Default.args,
    size: "xs",
  },
};
