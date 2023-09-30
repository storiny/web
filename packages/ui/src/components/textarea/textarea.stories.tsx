// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Typography from "~/components/typography";

import Textarea from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "components/textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    slot_props: {
      container: {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        style: { maxWidth: "300px" }
      }
    },
    placeholder: "Textarea placeholder"
  }
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithEndDecorator: Story = {
  args: {
    end_decorator: (
      <Typography level={"body2"} style={{ padding: "8px" }}>
        Decorator
      </Typography>
    )
  }
};

export const ColorInverted: Story = {
  args: {
    color: "inverted"
  }
};

export const ColorRuby: Story = {
  args: {
    color: "ruby"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    size: "sm"
  }
};
