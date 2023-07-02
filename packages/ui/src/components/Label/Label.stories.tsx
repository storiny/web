import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Label from "./Label";

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  decorators: [
    (Story): React.ReactElement => (
      <fieldset>
        <Story htmlFor={"sample"} />
        <input
          id={"sample"}
          placeholder={"Sample input"}
          style={{ visibility: "hidden" }}
        />
      </fieldset>
    )
  ],
  args: { children: "Label content" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const Required: Story = { args: { required: true } };
