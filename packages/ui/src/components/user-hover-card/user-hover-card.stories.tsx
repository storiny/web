// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { MOCK_USERS } from "../../mocks";
import UserHoverCard from "./user-hover-card";

const meta: Meta<typeof UserHoverCard> = {
  title: "components/user-hover-card",
  component: UserHoverCard,
  tags: ["autodocs"],
  argTypes: {
    open: {
      options: ["Uncontrolled", "Open", "Closed"],
      control: { type: "select" },
      mapping: {
        Uncontrolled: undefined,
        Open: true,
        Closed: false
      }
    }
  },
  args: {
    children: (
      <div
        className={css["flex-center"]}
        style={{
          padding: "32px",
          border: "1px dashed var(--divider)",
          borderRadius: "var(--radius-md)",
          width: "fit-content"
        }}
      >
        <Typography level={"body2"}>Hover over me</Typography>
      </div>
    ),
    identifier: MOCK_USERS[4].id
  }
};

export default meta;
type Story = StoryObj<typeof UserHoverCard>;

export const Default: Story = {};
