import { Notification, NotificationType } from "@storiny/types";

import { mockStories } from "../story";
import { mockTags } from "../tag";
import { mockUsers } from "../user";

export const testNotification: Notification = {
  read_at: null,
  type: NotificationType.SYSTEM,
  actor: null,
  rendered_content: "Notification content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

export const mockNotifications: Notification[] = [
  {
    read_at: null,
    type: NotificationType.STORY_LIKE,
    actor: mockUsers[0],
    rendered_content: `<a class="t-bold" href="/${mockUsers[0].username}">${mockUsers[0].name}</a> liked your story "<a class="t-medium" href="/${mockStories[0].user?.username}/${mockStories[0].slug}">${mockStories[0].title}</a>"`,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556338688"
  },
  {
    read_at: "2022-05-18T01:07:02.000Z",
    type: NotificationType.FRIEND_REQ_RECEIVED,
    actor: mockUsers[1],
    rendered_content: `<a class="t-bold" href="/${mockUsers[1].username}">${mockUsers[1].name}</a> sent you a friend request`,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680014708228"
  },
  {
    read_at: null,
    type: NotificationType.LOGIN_ATTEMPT,
    actor: null,
    rendered_content: `There was a successful login attempt to your account using <b>Safari on iPhone 6</a> near <b>Menlo Park, CA</a>. <a data-underline href="/me/privacy/sessions">Click to review</a>`,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637392061766836224"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_TAG,
    actor: mockUsers[2],
    rendered_content: `A new story was published in <a class="t-bold" href="/${mockTags[0].name}">#${mockTags[0].name}</a>: "<a class="t-medium" href="/${mockStories[1].user?.username}/${mockStories[1].slug}">${mockStories[1].title}</a>"`,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558059886592"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_USER,
    actor: mockUsers[3],
    rendered_content: `<a class="t-bold" href="/${mockUsers[3].username}">${mockUsers[3].name}</a> published a new story "<a class="t-medium" href="/${mockStories[2].user?.username}/${mockStories[2].slug}">${mockStories[2].title}</a>"`,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933439021056"
  },
  {
    read_at: null,
    type: NotificationType.STORY_LIKE,
    actor: mockUsers[0],
    rendered_content: `<a class="t-bold" href="/${mockUsers[8].username}">${mockUsers[8].name}</a> liked your story "<a class="t-medium" href="/${mockStories[8].user?.username}/${mockStories[8].slug}">${mockStories[8].title}</a>"`,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556300688"
  },
  {
    read_at: "2022-05-18T01:07:02.000Z",
    type: NotificationType.FRIEND_REQ_RECEIVED,
    actor: mockUsers[1],
    rendered_content: `<a class="t-bold" href="/${mockUsers[6].username}">${mockUsers[6].name}</a> sent you a friend request`,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877220014708228"
  },
  {
    read_at: null,
    type: NotificationType.LOGIN_ATTEMPT,
    actor: null,
    rendered_content: `There was a successful login attempt to your account using <b>Safari on iPhone 6</a> near <b>Menlo Park, CA</a>. <a data-underline href="/me/privacy/sessions">Click to review</a>`,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637334061766836224"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_TAG,
    actor: mockUsers[2],
    rendered_content: `A new story was published in <a class="t-bold" href="/${mockTags[7].name}">#${mockTags[7].name}</a>: "<a class="t-medium" href="/${mockStories[7].user?.username}/${mockStories[7].slug}">${mockStories[7].title}</a>"`,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667551259886592"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_USER,
    actor: mockUsers[3],
    rendered_content: `<a class="t-bold" href="/${mockUsers[9].username}">${mockUsers[9].name}</a> published a new story "<a class="t-medium" href="/${mockStories[9].user?.username}/${mockStories[9].slug}">${mockStories[9].title}</a>"`,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933429021056"
  }
];
