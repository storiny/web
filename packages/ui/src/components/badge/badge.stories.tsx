// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Avatar from "../avatar";
import Badge from "./badge";

const meta: Meta<typeof Badge> = {
  title: "components/badge",
  component: Badge,
  args: {
    size: "md",
    elevation: "body",
    color: "inverted",
    children: (
      <Avatar
        alt={"Test avatar"}
        avatar_id={"kevin.png"}
        borderless
        hex={"d3b4ac"}
      />
    )
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const ColorBeryl: Story = {
  args: {
    color: "beryl"
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

export const ColorMelon: Story = {
  args: {
    color: "melon"
  }
};

export const ColorLemon: Story = {
  args: {
    color: "lemon"
  }
};

export const SizeSM: Story = {
  args: {
    size: "sm"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};

export const SizeLG: Story = {
  args: {
    size: "lg"
  }
};

export const SizeXL: Story = {
  args: {
    size: "xl"
  }
};

export const ElevationBody: Story = {
  args: {
    elevation: "body"
  }
};

export const ElevationXS: Story = {
  args: {
    elevation: "xs"
  }
};

export const ElevationSM: Story = {
  args: {
    elevation: "sm"
  }
};

export const ElevationMD: Story = {
  args: {
    elevation: "md"
  }
};

export const ElevationLG: Story = {
  args: {
    elevation: "lg"
  }
};

export const Position: Story = {
  args: {
    anchor_origin: {
      horizontal: "left",
      vertical: "bottom"
    }
  }
};
