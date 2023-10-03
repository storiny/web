import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/button";

import ReportModal from "./report-modal";

const meta: Meta<typeof ReportModal> = {
  title: "entities/report-modal",
  component: ReportModal,
  args: {
    entity_type: "story",
    entity_id: "0",
    trigger: ({ open_modal }): React.ReactElement => (
      <Button onClick={open_modal}>Open report modal</Button>
    )
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ReportModal>;

export const Default: Story = {};
