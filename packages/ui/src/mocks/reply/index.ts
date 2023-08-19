import { Reply } from "@storiny/types";

import { mockComments, testComment } from "../comment";
import { mockUsers, testUser } from "../user";

export const testReply: Reply = {
  rendered_content: "<p>Reply content</p>",
  content: "Reply content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0",
  like_count: 1,
  user_id: testUser.id,
  comment_id: testComment.id,
  user: testUser,
  comment: testComment,
  edited_at: null,
  hidden: false
};

export const mockReplies: Reply[] = [
  {
    user: mockUsers[0],
    user_id: mockUsers[0].id,
    comment_id: mockComments[0].id,
    comment: mockComments[0],
    like_count: 1230,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556338688",
    hidden: false
  },
  {
    user: mockUsers[1],
    user_id: mockUsers[1].id,
    comment_id: mockComments[1].id,
    comment: mockComments[1],
    like_count: 9923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877680014708228",
    hidden: false
  },
  {
    user: mockUsers[2],
    user_id: mockUsers[2].id,
    comment_id: mockComments[2].id,
    comment: mockComments[2],
    like_count: 0,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637392061766836224",
    hidden: true
  },
  {
    user: mockUsers[3],
    user_id: mockUsers[3].id,
    comment_id: mockComments[3].id,
    comment: mockComments[3],
    like_count: 239,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667558059886592",
    hidden: false
  },
  {
    user: mockUsers[4],
    user_id: mockUsers[4].id,
    comment_id: mockComments[4].id,
    comment: mockComments[4],
    like_count: 923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933439021056",
    hidden: false
  },
  {
    user: mockUsers[5],
    user_id: mockUsers[5].id,
    comment_id: mockComments[5].id,
    comment: mockComments[5],
    like_count: 923,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-05-18T01:07:02.000Z",
    id: "1662665575556300688",
    hidden: false
  },
  {
    user: mockUsers[6],
    user_id: mockUsers[6].id,
    comment_id: mockComments[6].id,
    comment: mockComments[6],
    like_count: 0,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-04-18T01:07:02.000Z",
    id: "1638877220014708228",
    hidden: false
  },
  {
    user: mockUsers[7],
    user_id: mockUsers[7].id,
    comment_id: mockComments[7].id,
    comment: mockComments[7],
    like_count: 243,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-02-18T01:07:02.000Z",
    id: "1637334061766836224",
    hidden: false
  },
  {
    user: mockUsers[8],
    user_id: mockUsers[8].id,
    comment_id: mockComments[8].id,
    comment: mockComments[8],
    like_count: 1123,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2022-03-24T01:07:02.000Z",
    id: "1662667551259886592",
    hidden: false
  },
  {
    user: mockUsers[9],
    user_id: mockUsers[9].id,
    comment_id: mockComments[9].id,
    comment: mockComments[9],
    like_count: 24,
    content: "Reply content",
    rendered_content: "<p>Reply content</p>",
    edited_at: null,
    created_at: "2021-08-08T01:07:02.000Z",
    id: "1610662933429021056",
    hidden: true
  }
];
