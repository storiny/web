import { Comment } from "@storiny/types";

import { MOCK_STORIES, TEST_STORY } from "../story";
import { MOCK_USERS, TEST_USER } from "../user";

export const TEST_COMMENT: Comment = {
  rendered_content: "<p>Comment content</p>",
  content: "Comment content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0",
  reply_count: 1,
  like_count: 1,
  user_id: TEST_USER.id,
  story_id: TEST_STORY.id,
  story: TEST_STORY,
  user: TEST_USER,
  edited_at: null,
  hidden: false
};

export const MOCK_COMMENTS: Comment[] = [
  {
    user: MOCK_USERS[0],
    user_id: MOCK_USERS[0].id,
    story_id: MOCK_STORIES[0].id,
    story: MOCK_STORIES[0],
    like_count: 1230,
    reply_count: 32,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556338688",
    hidden: false
  },
  {
    user: MOCK_USERS[1],
    user_id: MOCK_USERS[1].id,
    story_id: MOCK_STORIES[1].id,
    story: MOCK_STORIES[1],
    like_count: 9923,
    reply_count: 91,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680014708228",
    hidden: false
  },
  {
    user: MOCK_USERS[2],
    user_id: MOCK_USERS[2].id,
    story_id: MOCK_STORIES[2].id,
    story: MOCK_STORIES[2],
    like_count: 0,
    reply_count: 1,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637392061766836224",
    hidden: true
  },
  {
    user: MOCK_USERS[3],
    user_id: MOCK_USERS[3].id,
    story_id: MOCK_STORIES[3].id,
    story: MOCK_STORIES[3],
    like_count: 239,
    reply_count: 9,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558059886592",
    hidden: false
  },
  {
    user: MOCK_USERS[4],
    user_id: MOCK_USERS[4].id,
    story_id: MOCK_STORIES[4].id,
    story: MOCK_STORIES[4],
    like_count: 923,
    reply_count: 13,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933439021056",
    hidden: false
  },
  {
    user: MOCK_USERS[5],
    user_id: MOCK_USERS[5].id,
    story_id: MOCK_STORIES[5].id,
    story: MOCK_STORIES[5],
    like_count: 923,
    reply_count: 0,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556300688",
    hidden: false
  },
  {
    user: MOCK_USERS[6],
    user_id: MOCK_USERS[6].id,
    story_id: MOCK_STORIES[6].id,
    story: MOCK_STORIES[6],
    like_count: 0,
    reply_count: 0,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877220014708228",
    hidden: false
  },
  {
    user: MOCK_USERS[7],
    user_id: MOCK_USERS[7].id,
    story_id: MOCK_STORIES[7].id,
    story: MOCK_STORIES[7],
    like_count: 243,
    reply_count: 22,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637334061766836224",
    hidden: false
  },
  {
    user: MOCK_USERS[8],
    user_id: MOCK_USERS[8].id,
    story_id: MOCK_STORIES[8].id,
    story: MOCK_STORIES[8],
    like_count: 1123,
    reply_count: 334,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667551259886592",
    hidden: false
  },
  {
    user: MOCK_USERS[9],
    user_id: MOCK_USERS[9].id,
    story_id: MOCK_STORIES[9].id,
    story: MOCK_STORIES[9],
    like_count: 24,
    reply_count: 3,
    content: "Comment content",
    rendered_content: "<p>Comment content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933429021056",
    hidden: false
  }
];
