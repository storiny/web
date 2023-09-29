// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import Button from "../button";
import TabPanel from "../tab-panel";
import ModalFooterButton from "./footer-button";
import Modal, { Description } from "./modal";
import { ModalProps } from "./modal.props";
import ModalSidebarItem from "./sidebar-item";
import ModalSidebarList from "./sidebar-list";
import { use_modal } from "./use-modal";

const meta: Meta<typeof Modal> = {
  title: "components/modal",
  component: Modal,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalComponent = (props?: ModalProps): React.ReactElement => {
  const [element] = use_modal(
    ({ open_modal }) => <Button onClick={open_modal}>Show modal</Button>,
    props?.children || "This is a modal",
    props
  );

  return element;
};

export const Default: Story = {
  args: { hide_close_button: false, fullscreen: false },
  render: (args) => <ModalComponent {...args} />
};

export const WithFooter: Story = {
  ...Default,
  args: {
    ...Default.args,
    slot_props: {
      header: { decorator: <RectangleIcon />, children: "Modal title" },
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      content: { style: { minHeight: "45vh", minWidth: "40vw" } }
    },
    footer: (
      <>
        <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
        <ModalFooterButton>Confirm</ModalFooterButton>
      </>
    )
  }
};

export const WithSidebar: Story = {
  ...WithFooter,
  args: {
    ...WithFooter.args,
    sidebar: (
      <p
        className={"t-body-2 t-minor"}
        style={{ padding: "8px", textAlign: "center" }}
      >
        Sidebar content
      </p>
    )
  }
};

export const Fullscreen: Story = {
  ...WithFooter,
  args: { ...WithFooter.args, fullscreen: true }
};

export const ModeTabbed: Story = {
  ...WithFooter,
  args: {
    ...WithFooter.args,
    mode: "tabbed",
    children: (
      <>
        <TabPanel value={"one"}>
          <Description>First tab panel</Description>
        </TabPanel>
        <TabPanel value={"two"}>
          <Description>Second tab panel</Description>
        </TabPanel>
        <TabPanel value={"three"}>
          <Description>Third tab panel</Description>
        </TabPanel>
      </>
    ),
    slot_props: {
      ...WithFooter?.args?.slot_props,
      tabs: { defaultValue: "one" },
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      content: { style: { minHeight: "45vh", minWidth: "40vw" } },
      body: {
        className: "t-body-2",
        style: { padding: "24px" }
      }
    },
    sidebar: (
      <ModalSidebarList>
        <ModalSidebarItem decorator={<RectangleIcon />} value={"one"}>
          One
        </ModalSidebarItem>
        <ModalSidebarItem decorator={<RectangleIcon />} value={"two"}>
          Two
        </ModalSidebarItem>
        <ModalSidebarItem decorator={<RectangleIcon />} value={"three"}>
          Three
        </ModalSidebarItem>
      </ModalSidebarList>
    )
  }
};
