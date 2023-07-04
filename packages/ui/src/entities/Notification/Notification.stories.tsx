// noinspection JSUnusedGlobalSymbols

import { NotificationType } from "@storiny/types";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { mockNotifications } from "../../mocks";
import Notification from "./Notification";
import NotificationSkeleton from "./Skeleton";

const meta: Meta<typeof Notification> = {
  title: "Entities/Notification",
  component: Notification,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const StoryLike: Story = {
  args: {
    notification: { ...mockNotifications[0], type: NotificationType.STORY_LIKE }
  }
};

export const FriendRequestAccept: Story = {
  args: {
    notification: {
      ...mockNotifications[1],
      type: NotificationType.FRIEND_REQ_ACCEPT
    }
  }
};

export const FollowerAdd: Story = {
  args: {
    notification: {
      ...mockNotifications[2],
      type: NotificationType.FOLLOWER_ADD
    }
  }
};

export const FriendRequestReceived: Story = {
  args: {
    notification: {
      ...mockNotifications[3],
      type: NotificationType.FRIEND_REQ_RECEIVED
    }
  }
};

export const StoryMention: Story = {
  args: {
    notification: {
      ...mockNotifications[4],
      type: NotificationType.STORY_MENTION
    }
  }
};

export const CommentAdd: Story = {
  args: {
    notification: {
      ...mockNotifications[0],
      type: NotificationType.COMMENT_ADD
    }
  }
};

export const ReplyAdd: Story = {
  args: {
    notification: { ...mockNotifications[1], type: NotificationType.REPLY_ADD }
  }
};

export const StoryAddByTag: Story = {
  args: {
    notification: {
      ...mockNotifications[2],
      type: NotificationType.STORY_ADD_BY_TAG
    }
  }
};

export const StoryAddByUser: Story = {
  args: {
    notification: {
      ...mockNotifications[3],
      type: NotificationType.STORY_ADD_BY_USER
    }
  }
};

export const System: Story = {
  args: {
    notification: { ...mockNotifications[4], type: NotificationType.SYSTEM }
  }
};

export const LoginAttempt: Story = {
  args: {
    notification: {
      ...mockNotifications[0],
      type: NotificationType.LOGIN_ATTEMPT
    }
  }
};

export const Skeleton: Story = {
  render: () => <NotificationSkeleton />
};
