import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  getBookmarks,
  getHistory,
  getHomeFeed,
  getLikedStories,
  getRightSidebarContent,
  getTagStories,
  getTagWriters,
  getUserEntities,
  getUserStories,
  login,
  recovery,
  resetPassword,
  signup,
  usernameValidation,
} from "./endpoints";

// Use latest
const API_VERSION = 1;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}`,
  }),
  endpoints: (builder) => ({
    // Get
    getRightSidebarContent: getRightSidebarContent(builder),
    getHomeFeed: getHomeFeed(builder),
    getBookmarks: getBookmarks(builder),
    getLikedStories: getLikedStories(builder),
    getHistory: getHistory(builder),
    getTagStories: getTagStories(builder),
    getTagWriters: getTagWriters(builder),
    getUserStories: getUserStories(builder),
    getUserEntities: getUserEntities(builder),
    // Validation
    usernameValidation: usernameValidation(builder),
    // Auth
    login: login(builder),
    signup: signup(builder),
    recovery: recovery(builder),
    resetPassword: resetPassword(builder),
  }),
});

export const {
  useGetRightSidebarContentQuery,
  useGetHomeFeedQuery,
  useGetBookmarksQuery,
  useGetLikedStoriesQuery,
  useGetHistoryQuery,
  useGetTagStoriesQuery,
  useGetTagWritersQuery,
  useGetUserStoriesQuery,
  useGetUserEntitiesQuery,
  useUsernameValidationMutation,
  useLoginMutation,
  useSignupMutation,
  useRecoveryMutation,
  useResetPasswordMutation,
} = apiSlice;
