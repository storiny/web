import type { Meta, StoryObj } from "@storybook/react";

import DateTime from "./date-time";

const meta: Meta<typeof DateTime> = {
  title: "components/date-time",
  component: DateTime,
  args: {
    date: new Date()
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof DateTime>;

export const Default: Story = {};
