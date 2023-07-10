import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  assetAlt,
  assetDelete,
  assetFavourite,
  assetRating,
  getBookmarks,
  getExploreStories,
  getExploreTags,
  getExploreWriters,
  getGalleryPhotos,
  getHistory,
  getHomeFeed,
  getLikedStories,
  getNotifications,
  getRightSidebarContent,
  getTagStories,
  getTagWriters,
  getUserAssets,
  getUserEntities,
  getUserStories,
  login,
  notificationSettings,
  recovery,
  resetPassword,
  signup,
  usernameValidation
} from "./endpoints";

// Use latest
const API_VERSION = 1;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}`
  }),
  tagTypes: ["Notification", "Asset"],
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
    getUserAssets: getUserAssets(builder),
    getExploreStories: getExploreStories(builder),
    getExploreWriters: getExploreWriters(builder),
    getExploreTags: getExploreTags(builder),
    getNotifications: getNotifications(builder),
    getGalleryPhotos: getGalleryPhotos(builder),
    // Validation
    usernameValidation: usernameValidation(builder),
    // Auth
    login: login(builder),
    signup: signup(builder),
    recovery: recovery(builder),
    resetPassword: resetPassword(builder),
    // Settings
    notificationSettings: notificationSettings(builder),
    // Other
    assetAlt: assetAlt(builder),
    assetDelete: assetDelete(builder),
    assetFavourite: assetFavourite(builder),
    assetRating: assetRating(builder)
  })
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
  useGetUserAssetsQuery,
  useGetExploreStoriesQuery,
  useGetExploreWritersQuery,
  useGetExploreTagsQuery,
  useGetNotificationsQuery,
  useGetGalleryPhotosQuery,
  useUsernameValidationMutation,
  useLoginMutation,
  useSignupMutation,
  useRecoveryMutation,
  useResetPasswordMutation,
  useNotificationSettingsMutation,
  useAssetFavouriteMutation,
  useAssetAltMutation,
  useAssetDeleteMutation,
  useAssetRatingMutation
} = apiSlice;
