// noinspection JSUnusedGlobalSymbols

import { Flag, UserFlag } from "@storiny/web/src/common/flags";
import type { Meta, StoryObj } from "@storybook/react";

import BadgeArray from "./badge-array";

const flags = new Flag();

flags.add_flag(UserFlag.STAFF);
flags.add_flag(UserFlag.EARLY_USER);

const meta: Meta<typeof BadgeArray> = {
  title: "components/badge-array",
  component: BadgeArray,
  tags: ["autodocs"],
  args: {
    flags: flags.get_flags(),
    size: 16
  }
};

export default meta;
type Story = StoryObj<typeof BadgeArray>;

export const Default: Story = {};
