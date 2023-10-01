import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Divider from "./divider";

const meta: Meta<typeof Divider> = {
  title: "components/divider",
  component: Divider,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {};

export const OrientationHorizontal: Story = {
  args: {
    orientation: "horizontal"
  }
};

export const OrientationVertical: Story = {
  render: (args) => (
    <div className={css["flex-center"]} style={{ height: "128px" }}>
      <Divider {...args} />
    </div>
  ),
  args: {
    orientation: "vertical"
  }
};
