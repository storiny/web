import type { Meta, StoryObj } from "@storybook/react";

import Link from "./link";

const meta: Meta<typeof Link> = {
  title: "components/link",
  component: Link,
  args: {
    color: "body",
    level: "body1",
    underline: "hover",
    href: "#",
    children: "Quick brown fox jump over the lazy dog"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {};

export const FixedColor: Story = {
  args: {
    fixed_color: true
  }
};

export const ColorBody: Story = {
  args: {
    color: "body"
  }
};

export const ColorBeryl: Story = {
  args: {
    color: "beryl"
  }
};

export const UnderlineAlways: Story = {
  args: {
    underline: "always"
  }
};

export const UnderlineHover: Story = {
  args: {
    underline: "hover"
  }
};

export const UnderlineNever: Story = {
  args: {
    underline: "never"
  }
};

export const LevelDisplay1: Story = {
  args: {
    children: "Display 1",
    level: "display1"
  }
};

export const LevelDisplay2: Story = {
  args: {
    children: "Display 2",
    level: "display2"
  }
};

export const LevelHeading1: Story = {
  args: {
    children: "Heading 1",
    level: "h1"
  }
};

export const LevelHeading2: Story = {
  args: {
    children: "Heading 2",
    level: "h2"
  }
};

export const LevelHeading3: Story = {
  args: {
    children: "Heading 3",
    level: "h3"
  }
};

export const LevelHeading4: Story = {
  args: {
    children: "Heading 4",
    level: "h4"
  }
};

export const LevelHeading5: Story = {
  args: {
    children: "Heading 5",
    level: "h5"
  }
};

export const LevelHeading6: Story = {
  args: {
    children: "Heading 6",
    level: "h6"
  }
};

export const LevelBody1: Story = {
  args: {
    children: "Body 1",
    level: "body1"
  }
};

export const LevelBody2: Story = {
  args: {
    children: "Body 2",
    level: "body2"
  }
};

export const LevelBody3: Story = {
  args: {
    children: "Body 3",
    level: "body3"
  }
};

export const Ellipsis: Story = {
  args: {
    style: { maxWidth: "128px" },
    ellipsis: true,
    children: "A long text that will get truncated"
  }
};
