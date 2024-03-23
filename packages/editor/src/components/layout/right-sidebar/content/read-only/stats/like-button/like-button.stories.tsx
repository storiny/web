// noinspection JSUnusedGlobalSymbols

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import HydrateMetadata from "../../../../../../hydrate-metadata";
import LikeButton from "./like-button";

const meta: Meta<typeof LikeButton> = {
  title: "components/like-button",
  component: LikeButton,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof LikeButton>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <HydrateMetadata
          is_writer={false}
          role={"reader"}
          story={MOCK_STORIES[0]}
        >
          <Story />
        </HydrateMetadata>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};
