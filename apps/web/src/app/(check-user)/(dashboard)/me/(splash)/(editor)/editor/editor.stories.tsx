// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../layout";
import DashboardSplashLayout from "../../layout";
import EditorLayout from "../layout";
import Editor from "./editor";

const meta: Meta<typeof Editor> = {
  title: "dashboard/Editor",
  component: Editor,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DashboardLayout>
          <DashboardSplashLayout>
            <EditorLayout>
              <Story />
            </EditorLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignorePrimitiveProviders: false, loggedIn: true }
      )
  ]
};
