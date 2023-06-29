import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Typography from "./Typography";

const meta: Meta<typeof Typography> = {
  title: "Components/Typography",
  component: Typography,
  args: {
    color: "major",
    level: "body1",
    children: "Quick brown fox jumps over the lazy dog",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const Default: Story = {};

export const ColorMuted: Story = {
  args: {
    color: "muted",
  },
};

export const ColorMinor: Story = {
  args: {
    color: "minor",
  },
};

export const ColorMajor: Story = {
  args: {
    color: "major",
  },
};

export const LevelMention: Story = {
  args: {
    level: "mention",
    children: "username",
  },
  render: (args) => (
    <Typography level={"body2"}>
      <Typography {...args} />
    </Typography>
  ),
};

export const LevelTag: Story = {
  args: {
    level: "tag",
    children: "tag-name",
  },
  render: (args) => (
    <Typography level={"body2"}>
      <Typography {...args} />
    </Typography>
  ),
};

export const LevelInlineCode: Story = {
  args: {
    level: "inline-code",
    children: "const foo = 'bar';",
  },
};

export const LevelInlineCodeWithColor: Story = {
  args: {
    level: "inline-code",
    children: "#C5FF00",
  },
};

export const LevelQuote: Story = {
  args: {
    level: "quote",
    children: `"Remembering that you are going to die is the best way I know to avoid the trap of thinking you have something to lose. You are already naked. There is no reason not to follow your heart." — Steve Jobs`,
  },
};

export const LevelDisplay1: Story = {
  args: {
    children: "Display 1",
    level: "display1",
  },
};

export const LevelDisplay2: Story = {
  args: {
    children: "Display 2",
    level: "display2",
  },
};

export const LevelHeading1: Story = {
  args: {
    children: "Heading 1",
    level: "h1",
  },
};

export const LevelHeading2: Story = {
  args: {
    children: "Heading 2",
    level: "h2",
  },
};

export const LevelHeading3: Story = {
  args: {
    children: "Heading 3",
    level: "h3",
  },
};

export const LevelHeading4: Story = {
  args: {
    children: "Heading 4",
    level: "h4",
  },
};

export const LevelHeading5: Story = {
  args: {
    children: "Heading 5",
    level: "h5",
  },
};

export const LevelHeading6: Story = {
  args: {
    children: "Heading 6",
    level: "h6",
  },
};

export const LevelLegible: Story = {
  args: {
    children: "Legible",
    level: "legible",
  },
};

export const LevelBody1: Story = {
  args: {
    children: "Body 1",
    level: "body1",
  },
};

export const LevelBody2: Story = {
  args: {
    children: "Body 2",
    level: "body2",
  },
};

export const LevelBody3: Story = {
  args: {
    children: "Body 3",
    level: "body3",
  },
};

export const Nested: Story = {
  render: () => (
    <Typography>
      This text is inside a root{" "}
      <Typography level={"inline-code"}>p</Typography> element and{" "}
      <Typography>
        this text is inside a nested{" "}
        <Typography level={"inline-code"}>span</Typography> element.
      </Typography>
    </Typography>
  ),
};

export const Ellipsis: Story = {
  args: {
    style: { maxWidth: "128px" },
    ellipsis: true,
    children: "A long text that will get truncated",
  },
};
