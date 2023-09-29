import { Reply } from "@storiny/types";

import { MOCK_COMMENTS, TEST_COMMENT } from "../comment";
import { MOCK_USERS, TEST_USER } from "../user";

export const TEST_REPLY: Reply = {
  rendered_content: "<p>Reply content</p>",
  content: "Reply content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0",
  like_count: 1,
  user_id: TEST_USER.id,
  comment_id: TEST_COMMENT.id,
  user: TEST_USER,
  comment: TEST_COMMENT,
  edited_at: null,
  hidden: false
};

export const MOCK_REPLIES: Reply[] = [
  {
    user: MOCK_USERS[0],
    user_id: MOCK_USERS[0].id,
    comment_id: MOCK_COMMENTS[0].id,
    comment: MOCK_COMMENTS[0],
    like_count: 1230,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556338688",
    hidden: false
  },
  {
    user: MOCK_USERS[1],
    user_id: MOCK_USERS[1].id,
    comment_id: MOCK_COMMENTS[1].id,
    comment: MOCK_COMMENTS[1],
    like_count: 9923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680014708228",
    hidden: false
  },
  {
    user: MOCK_USERS[2],
    user_id: MOCK_USERS[2].id,
    comment_id: MOCK_COMMENTS[2].id,
    comment: MOCK_COMMENTS[2],
    like_count: 0,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637392061766836224",
    hidden: true
  },
  {
    user: MOCK_USERS[3],
    user_id: MOCK_USERS[3].id,
    comment_id: MOCK_COMMENTS[3].id,
    comment: MOCK_COMMENTS[3],
    like_count: 239,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558059886592",
    hidden: false
  },
  {
    user: MOCK_USERS[4],
    user_id: MOCK_USERS[4].id,
    comment_id: MOCK_COMMENTS[4].id,
    comment: MOCK_COMMENTS[4],
    like_count: 923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933439021056",
    hidden: false
  },
  {
    user: MOCK_USERS[5],
    user_id: MOCK_USERS[5].id,
    comment_id: MOCK_COMMENTS[5].id,
    comment: MOCK_COMMENTS[5],
    like_count: 923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556300688",
    hidden: false
  },
  {
    user: MOCK_USERS[6],
    user_id: MOCK_USERS[6].id,
    comment_id: MOCK_COMMENTS[6].id,
    comment: MOCK_COMMENTS[6],
    like_count: 0,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877220014708228",
    hidden: false
  },
  {
    user: MOCK_USERS[7],
    user_id: MOCK_USERS[7].id,
    comment_id: MOCK_COMMENTS[7].id,
    comment: MOCK_COMMENTS[7],
    like_count: 243,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637334061766836224",
    hidden: false
  },
  {
    user: MOCK_USERS[8],
    user_id: MOCK_USERS[8].id,
    comment_id: MOCK_COMMENTS[8].id,
    comment: MOCK_COMMENTS[8],
    like_count: 1123,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667551259886592",
    hidden: false
  },
  {
    user: MOCK_USERS[9],
    user_id: MOCK_USERS[9].id,
    comment_id: MOCK_COMMENTS[9].id,
    comment: MOCK_COMMENTS[9],
    like_count: 24,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933429021056",
    hidden: true
  }
];
