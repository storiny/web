import { Comment } from "@storiny/types";

import { mockStories, testStory } from "../story";
import { mockUsers, testUser } from "../user";

export const testComment: Comment = {
  rendered_content: "<p>Comment content</p>",
  content: "Comment content",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0",
  reply_count: 1,
  like_count: 1,
  user_id: testUser.id,
  story_id: testStory.id,
  story: testStory,
  user: testUser,
  edited_at: null,
  hidden: false
};

export const mockComments: Comment[] = [
  {
    user: mockUsers[0],
    user_id: mockUsers[0].id,
    story_id: mockStories[0].id,
    story: mockStories[0],
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
    user: mockUsers[1],
    user_id: mockUsers[1].id,
    story_id: mockStories[1].id,
    story: mockStories[1],
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
    user: mockUsers[2],
    user_id: mockUsers[2].id,
    story_id: mockStories[2].id,
    story: mockStories[2],
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
    user: mockUsers[3],
    user_id: mockUsers[3].id,
    story_id: mockStories[3].id,
    story: mockStories[3],
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
    user: mockUsers[4],
    user_id: mockUsers[4].id,
    story_id: mockStories[4].id,
    story: mockStories[4],
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
    user: mockUsers[5],
    user_id: mockUsers[5].id,
    story_id: mockStories[5].id,
    story: mockStories[5],
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
    user: mockUsers[6],
    user_id: mockUsers[6].id,
    story_id: mockStories[6].id,
    story: mockStories[6],
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
    user: mockUsers[7],
    user_id: mockUsers[7].id,
    story_id: mockStories[7].id,
    story: mockStories[7],
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
    user: mockUsers[8],
    user_id: mockUsers[8].id,
    story_id: mockStories[8].id,
    story: mockStories[8],
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
    user: mockUsers[9],
    user_id: mockUsers[9].id,
    story_id: mockStories[9].id,
    story: mockStories[9],
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
