import { NotificationType } from "@storiny/shared";
import { Notification } from "@storiny/types";

import { MOCK_STORIES } from "../story";
import { MOCK_TAGS } from "../tag";
import { MOCK_USERS } from "../user";

export const TEST_NOTIFICATION: Notification = {
  read_at: null,
  type: NotificationType.SYSTEM,
  actor: null,
  rendered_content: "Notification content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    read_at: null,
    type: NotificationType.STORY_LIKE,
    actor: MOCK_USERS[0],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[0].username}">${MOCK_USERS[0].name}</a> liked your story "<a data-fw-medium href="/${MOCK_STORIES[0].user?.username}/${MOCK_STORIES[0].slug}">${MOCK_STORIES[0].title}</a>"`,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556338688"
  },
  {
    read_at: "2022-05-18T01:07:02.000Z",
    type: NotificationType.FRIEND_REQ_RECEIVED,
    actor: MOCK_USERS[1],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[1].username}">${MOCK_USERS[1].name}</a> sent you a friend request`,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680014708228"
  },
  {
    read_at: null,
    type: NotificationType.LOGIN_ATTEMPT,
    actor: null,
    rendered_content: `There was a successful login attempt to your account using <b>Safari on iPhone 6</b> near <b>Menlo Park, CA</b>. <a data-underline href="/me/account/login-activity">Click to review</a>`,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637392061766836224"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_TAG,
    actor: MOCK_USERS[2],
    rendered_content: `A new story was published in <a data-fw-bold href="/${MOCK_TAGS[0].name}">#${MOCK_TAGS[0].name}</a>: "<a data-fw-medium href="/${MOCK_STORIES[1].user?.username}/${MOCK_STORIES[1].slug}">${MOCK_STORIES[1].title}</a>"`,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558059886592"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_USER,
    actor: MOCK_USERS[3],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[3].username}">${MOCK_USERS[3].name}</a> published a new story "<a data-fw-medium href="/${MOCK_STORIES[2].user?.username}/${MOCK_STORIES[2].slug}">${MOCK_STORIES[2].title}</a>"`,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933439021056"
  },
  {
    read_at: null,
    type: NotificationType.STORY_LIKE,
    actor: MOCK_USERS[0],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[8].username}">${MOCK_USERS[8].name}</a> liked your story "<a data-fw-medium href="/${MOCK_STORIES[8].user?.username}/${MOCK_STORIES[8].slug}">${MOCK_STORIES[8].title}</a>"`,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556300688"
  },
  {
    read_at: "2022-05-18T01:07:02.000Z",
    type: NotificationType.FRIEND_REQ_RECEIVED,
    actor: MOCK_USERS[1],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[6].username}">${MOCK_USERS[6].name}</a> sent you a friend request`,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877220014708228"
  },
  {
    read_at: null,
    type: NotificationType.LOGIN_ATTEMPT,
    actor: null,
    rendered_content: `There was a successful login attempt to your account using <b>Safari on iPhone 6</b> near <b>Menlo Park, CA</b>. <a data-underline href="/me/account/login-activity">Click to review</a>`,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637334061766836224"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_TAG,
    actor: MOCK_USERS[2],
    rendered_content: `A new story was published in <a data-fw-bold href="/${MOCK_TAGS[7].name}">#${MOCK_TAGS[7].name}</a>: "<a data-fw-medium href="/${MOCK_STORIES[7].user?.username}/${MOCK_STORIES[7].slug}">${MOCK_STORIES[7].title}</a>"`,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667551259886592"
  },
  {
    read_at: null,
    type: NotificationType.STORY_ADD_BY_USER,
    actor: MOCK_USERS[3],
    rendered_content: `<a data-fw-bold href="/${MOCK_USERS[9].username}">${MOCK_USERS[9].name}</a> published a new story "<a data-fw-medium href="/${MOCK_STORIES[9].user?.username}/${MOCK_STORIES[9].slug}">${MOCK_STORIES[9].title}</a>"`,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933429021056"
  }
];
