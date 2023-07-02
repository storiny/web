// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import ScrollArea from "./ScrollArea";

const meta: Meta<typeof ScrollArea> = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  args: {
    enableHorizontal: false
  }
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  args: {
    style: {
      border: "1px solid var(--divider)",
      borderRadius: "var(--radius-sm)",
      width: "256px",
      height: "224px"
    },
    children: (
      <div
        className={"t-body-2 t-minor"}
        style={{
          padding: "12px 14px"
        }}
      >
        The old bookstore stood as a sanctuary of knowledge. Rows upon rows of
        books lined the shelves, their spines worn from years of exploration.
        The air was filled with the scent of aged paper and ink, a comforting
        aroma that whispered of countless stories waiting to be discovered. Soft
        beams of sunlight filtered through the dusty windows, casting a gentle
        glow upon the readers lost in their literary journeys.
      </div>
    )
  }
};

export const HorizontalScroll: Story = {
  args: {
    ...Default.args,
    type: "always",
    enableHorizontal: true,
    children: (
      <div
        className={"t-body-2 t-minor"}
        style={{
          padding: "12px 14px"
        }}
      >
        {[...Array(50)].map((_, index) => (
          <div
            key={index}
            style={{ whiteSpace: "nowrap", marginBottom: "8px" }}
          >
            The old bookstore stood as a sanctuary of knowledge. Rows upon rows
            of books lined the shelves, their spines worn from years of
            exploration.
          </div>
        ))}
      </div>
    )
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
