// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/Rectangle";

import Button from "../Button";
import TabPanel from "../TabPanel";
import ModalFooterButton from "./FooterButton";
import Modal, { Description } from "./Modal";
import { ModalProps } from "./Modal.props";
import ModalSidebarItem from "./SidebarItem";
import ModalSidebarList from "./SidebarList";
import { useModal } from "./useModal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalComponent = (props?: ModalProps): React.ReactElement => {
  const [element, modal] = useModal(
    <Button
      onClick={(): void => modal(props?.children || "This is a modal", props)}
    >
      Show modal
    </Button>
  );

  return element;
};

export const Default: Story = {
  args: { hideCloseButton: false, fullscreen: false },
  render: (args) => <ModalComponent {...args} />
};

export const WithFooter: Story = {
  ...Default,
  args: {
    ...Default.args,
    slotProps: {
      header: { decorator: <RectangleIcon />, children: "Modal title" },
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
    slotProps: {
      ...WithFooter?.args?.slotProps,
      tabs: { defaultValue: "one" },
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
