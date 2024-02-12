// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Persona from "./persona";

const meta: Meta<typeof Persona> = {
  title: "entities/persona",
  component: Persona,
  args: { size: "md" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Persona>;

export const Default: Story = {
  args: {
    primary_text: "Primary text",
    secondary_text: "Secondary text",
    avatar: {
      alt: "Test avatar",
      src: "/images/uploads/louie.png",
      hex: "d3b4ac"
    }
  }
};

export const MultipleAvatars: Story = {
  args: {
    ...Default.args,
    avatar: [
      {
        alt: "First test avatar",
        src: "/images/uploads/louie.png",
        hex: "d3b4ac"
      },
      {
        alt: "Second test avatar",
        src: "/images/uploads/kevin.png",
        hex: "7da110"
      },
      {
        alt: "Third test avatar",
        src: "/images/uploads/oscar.png",
        hex: "acc5d3"
      }
    ]
  }
};

export const WithoutSecondaryText: Story = {
  args: {
    ...Default.args,
    secondary_text: undefined
  }
};

export const SizeLG: Story = {
  args: {
    ...Default.args,
    size: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    ...Default.args,
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    ...Default.args,
    size: "sm"
  }
};

export const SizeXS: Story = {
  args: {
    ...Default.args,
    size: "xs"
  }
};
