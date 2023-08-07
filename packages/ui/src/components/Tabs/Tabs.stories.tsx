// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import clsx from "clsx";
import React from "react";

import RectangleIcon from "~/icons/Rectangle";

import Tab from "../Tab";
import TabPanel, { TabPanelProps } from "../TabPanel";
import TabsList from "../TabsList/TabsList";
import Tabs from "./Tabs";

const CustomTabPanel = ({
  className,
  style,
  children,
  ...rest
}: TabPanelProps): React.ReactElement => (
  <TabPanel
    {...rest}
    className={clsx("t-body-2", "t-minor", className)}
    style={{
      padding: "calc(2.4 * var(--spacing))",
      border: "1px solid var(--divider)",
      backgroundColor: "var(--bg-elevation-xs)",
      ...style
    }}
  >
    {children}
  </TabPanel>
);

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
    defaultValue: "one",
    children: (
      <>
        <TabsList>
          <Tab decorator={<RectangleIcon />} value={"one"}>
            One
          </Tab>
          <Tab decorator={<RectangleIcon />} value={"two"}>
            Two
          </Tab>
          <Tab decorator={<RectangleIcon />} value={"three"}>
            Three
          </Tab>
        </TabsList>
        <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
        <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
        <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
      </>
    )
  }
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};

export const OrientationHorizontal: Story = {
  args: {
    orientation: "horizontal"
  }
};

export const OrientationVertical: Story = {
  args: {
    orientation: "vertical"
  }
};

export const TextOnlyLG: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"lg"}>
        <Tab value={"one"}>One</Tab>
        <Tab value={"two"}>Two</Tab>
        <Tab value={"three"}>Three</Tab>
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};

export const TextOnlyMD: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"md"}>
        <Tab value={"one"}>One</Tab>
        <Tab value={"two"}>Two</Tab>
        <Tab value={"three"}>Three</Tab>
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};

export const IconOnlyLG: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"lg"}>
        <Tab decorator={<RectangleIcon />} value={"one"} />
        <Tab decorator={<RectangleIcon />} value={"two"} />
        <Tab decorator={<RectangleIcon />} value={"three"} />
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};

export const IconOnlyMD: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"md"}>
        <Tab decorator={<RectangleIcon />} value={"one"} />
        <Tab decorator={<RectangleIcon />} value={"two"} />
        <Tab decorator={<RectangleIcon />} value={"three"} />
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};

export const SizeLG: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"lg"}>
        <Tab decorator={<RectangleIcon />} value={"one"}>
          One
        </Tab>
        <Tab decorator={<RectangleIcon />} value={"two"}>
          Two
        </Tab>
        <Tab decorator={<RectangleIcon />} value={"three"}>
          Three
        </Tab>
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};

export const SizeMD: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList size={"md"}>
        <Tab decorator={<RectangleIcon />} value={"one"}>
          One
        </Tab>
        <Tab decorator={<RectangleIcon />} value={"two"}>
          Two
        </Tab>
        <Tab decorator={<RectangleIcon />} value={"three"}>
          Three
        </Tab>
      </TabsList>
      <CustomTabPanel value={"one"}>First panel</CustomTabPanel>
      <CustomTabPanel value={"two"}>Second panel</CustomTabPanel>
      <CustomTabPanel value={"three"}>Third panel</CustomTabPanel>
    </Tabs>
  )
};
