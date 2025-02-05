// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import css from "~/theme/main.module.scss";

import Spacer from "./spacer";

const meta: Meta<typeof Spacer> = {
  title: "components/spacer",
  component: Spacer,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
    size: 1
  }
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {
  render: (args) => (
    <div
      className={css["flex-center"]}
      style={{
        flexDirection: args.orientation === "vertical" ? "column" : "row"
      }}
    >
      <p className={css["t-body-2 t-minor"]}>Primary text</p>
      <Spacer {...args} />
      <p className={css["t-body-2 t-minor"]}>Secondary text</p>
    </div>
  )
};

export const OrientationHorizontal: Story = {
  ...Default,
  args: {
    orientation: "horizontal"
  }
};

export const Inline: Story = {
  ...Default,
  args: {
    inline: true
  }
};

export const OrientationVertical: Story = {
  render: (args) => (
    <div className={css["flex-center"]} style={{ flexDirection: "column" }}>
      <p className={css["t-body-2 t-minor"]}>Primary text</p>
      <Spacer {...args} />
      <p className={css["t-body-2 t-minor"]}>Secondary text</p>
    </div>
  ),
  args: {
    orientation: "vertical"
  }
};
