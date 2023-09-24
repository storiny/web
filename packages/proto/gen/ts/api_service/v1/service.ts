/* eslint-disable */
import { ChannelCredentials, Client, makeGenericClientConstructor, Metadata } from "@grpc/grpc-js";
import type {
  CallOptions,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import { GetConnectionSettingsRequest, GetConnectionSettingsResponse } from "../../connection_settings_def/v1/def";
import { GetCredentialSettingsRequest, GetCredentialSettingsResponse } from "../../credential_settings_def/v1/def";
import { GetLoginActivityRequest, GetLoginActivityResponse } from "../../login_activity_def/v1/def";
import {
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse,
} from "../../notification_settings_def/v1/def";
import { GetPrivacySettingsRequest, GetPrivacySettingsResponse } from "../../privacy_settings_def/v1/def";
import { GetProfileRequest, GetProfileResponse } from "../../profile_def/v1/def";
import {
  GetResponsesInfoRequest,
  GetResponsesInfoResponse,
  GetStoryResponsesInfoRequest,
  GetStoryResponsesInfoResponse,
} from "../../response_def/v1/def";
import {
  GetDraftsInfoRequest,
  GetDraftsInfoResponse,
  GetStoriesInfoRequest,
  GetStoriesInfoResponse,
  GetStoryRequest,
  GetStoryResponse,
} from "../../story_def/v1/def";
import {
  GetFollowedTagCountRequest,
  GetFollowedTagCountResponse,
  GetTagRequest,
  GetTagResponse,
} from "../../tag_def/v1/def";
import { GetTokenRequest, GetTokenResponse, VerifyEmailRequest, VerifyEmailResponse } from "../../token_def/v1/def";
import {
  GetUserBlockCountRequest,
  GetUserBlockCountResponse,
  GetUserIdRequest,
  GetUserIdResponse,
  GetUserMuteCountRequest,
  GetUserMuteCountResponse,
  GetUserRelationsInfoRequest,
  GetUserRelationsInfoResponse,
} from "../../user_def/v1/def";

export const protobufPackage = "api_service.v1";

/** Service definition */
export type ApiServiceService = typeof ApiServiceService;
export const ApiServiceService = {
  /** Checks whether the user is authenticated using the token from the session cookie */
  getUserId: {
    path: "/api_service.v1.ApiService/GetUserId",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUserIdRequest) => Buffer.from(GetUserIdRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUserIdRequest.decode(value),
    responseSerialize: (value: GetUserIdResponse) => Buffer.from(GetUserIdResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUserIdResponse.decode(value),
  },
  /** Returns the profile page data for a user */
  getProfile: {
    path: "/api_service.v1.ApiService/GetProfile",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetProfileRequest) => Buffer.from(GetProfileRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetProfileRequest.decode(value),
    responseSerialize: (value: GetProfileResponse) => Buffer.from(GetProfileResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetProfileResponse.decode(value),
  },
  /** Returns the tag page data for a tag */
  getTag: {
    path: "/api_service.v1.ApiService/GetTag",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTagRequest) => Buffer.from(GetTagRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTagRequest.decode(value),
    responseSerialize: (value: GetTagResponse) => Buffer.from(GetTagResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTagResponse.decode(value),
  },
  /** Returns the token using its identifier */
  getToken: {
    path: "/api_service.v1.ApiService/GetToken",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTokenRequest) => Buffer.from(GetTokenRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTokenRequest.decode(value),
    responseSerialize: (value: GetTokenResponse) => Buffer.from(GetTokenResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTokenResponse.decode(value),
  },
  /** Verifies a user's email using the provided token identifier */
  verifyEmail: {
    path: "/api_service.v1.ApiService/VerifyEmail",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: VerifyEmailRequest) => Buffer.from(VerifyEmailRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => VerifyEmailRequest.decode(value),
    responseSerialize: (value: VerifyEmailResponse) => Buffer.from(VerifyEmailResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => VerifyEmailResponse.decode(value),
  },
  /** Returns the user's credentials settings */
  getCredentialSettings: {
    path: "/api_service.v1.ApiService/GetCredentialSettings",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetCredentialSettingsRequest) =>
      Buffer.from(GetCredentialSettingsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetCredentialSettingsRequest.decode(value),
    responseSerialize: (value: GetCredentialSettingsResponse) =>
      Buffer.from(GetCredentialSettingsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetCredentialSettingsResponse.decode(value),
  },
  /** Returns the user's privacy settings */
  getPrivacySettings: {
    path: "/api_service.v1.ApiService/GetPrivacySettings",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetPrivacySettingsRequest) =>
      Buffer.from(GetPrivacySettingsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetPrivacySettingsRequest.decode(value),
    responseSerialize: (value: GetPrivacySettingsResponse) =>
      Buffer.from(GetPrivacySettingsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetPrivacySettingsResponse.decode(value),
  },
  /** Returns the user's notification settings */
  getNotificationSettings: {
    path: "/api_service.v1.ApiService/GetNotificationSettings",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetNotificationSettingsRequest) =>
      Buffer.from(GetNotificationSettingsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetNotificationSettingsRequest.decode(value),
    responseSerialize: (value: GetNotificationSettingsResponse) =>
      Buffer.from(GetNotificationSettingsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetNotificationSettingsResponse.decode(value),
  },
  /** Returns the user's connection settings */
  getConnectionSettings: {
    path: "/api_service.v1.ApiService/GetConnectionSettings",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetConnectionSettingsRequest) =>
      Buffer.from(GetConnectionSettingsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetConnectionSettingsRequest.decode(value),
    responseSerialize: (value: GetConnectionSettingsResponse) =>
      Buffer.from(GetConnectionSettingsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetConnectionSettingsResponse.decode(value),
  },
  /** Returns the user's login activity */
  getLoginActivity: {
    path: "/api_service.v1.ApiService/GetLoginActivity",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetLoginActivityRequest) => Buffer.from(GetLoginActivityRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetLoginActivityRequest.decode(value),
    responseSerialize: (value: GetLoginActivityResponse) =>
      Buffer.from(GetLoginActivityResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetLoginActivityResponse.decode(value),
  },
  /** Returns the user's drafts details */
  getDraftsInfo: {
    path: "/api_service.v1.ApiService/GetDraftsInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetDraftsInfoRequest) => Buffer.from(GetDraftsInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetDraftsInfoRequest.decode(value),
    responseSerialize: (value: GetDraftsInfoResponse) => Buffer.from(GetDraftsInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetDraftsInfoResponse.decode(value),
  },
  /** Returns the user's stories details */
  getStoriesInfo: {
    path: "/api_service.v1.ApiService/GetStoriesInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetStoriesInfoRequest) => Buffer.from(GetStoriesInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetStoriesInfoRequest.decode(value),
    responseSerialize: (value: GetStoriesInfoResponse) => Buffer.from(GetStoriesInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetStoriesInfoResponse.decode(value),
  },
  /** Returns the user's responses details */
  getResponsesInfo: {
    path: "/api_service.v1.ApiService/GetResponsesInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetResponsesInfoRequest) => Buffer.from(GetResponsesInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetResponsesInfoRequest.decode(value),
    responseSerialize: (value: GetResponsesInfoResponse) =>
      Buffer.from(GetResponsesInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetResponsesInfoResponse.decode(value),
  },
  /** Returns the story's responses details */
  getStoryResponsesInfo: {
    path: "/api_service.v1.ApiService/GetStoryResponsesInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetStoryResponsesInfoRequest) =>
      Buffer.from(GetStoryResponsesInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetStoryResponsesInfoRequest.decode(value),
    responseSerialize: (value: GetStoryResponsesInfoResponse) =>
      Buffer.from(GetStoryResponsesInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetStoryResponsesInfoResponse.decode(value),
  },
  /** Returns the user's followed tag count */
  getFollowedTagCount: {
    path: "/api_service.v1.ApiService/GetFollowedTagCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetFollowedTagCountRequest) =>
      Buffer.from(GetFollowedTagCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetFollowedTagCountRequest.decode(value),
    responseSerialize: (value: GetFollowedTagCountResponse) =>
      Buffer.from(GetFollowedTagCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetFollowedTagCountResponse.decode(value),
  },
  /** Returns the user's relations details */
  getUserRelationsInfo: {
    path: "/api_service.v1.ApiService/GetUserRelationsInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUserRelationsInfoRequest) =>
      Buffer.from(GetUserRelationsInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUserRelationsInfoRequest.decode(value),
    responseSerialize: (value: GetUserRelationsInfoResponse) =>
      Buffer.from(GetUserRelationsInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUserRelationsInfoResponse.decode(value),
  },
  /** Returns the user's block count */
  getUserBlockCount: {
    path: "/api_service.v1.ApiService/GetUserBlockCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUserBlockCountRequest) => Buffer.from(GetUserBlockCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUserBlockCountRequest.decode(value),
    responseSerialize: (value: GetUserBlockCountResponse) =>
      Buffer.from(GetUserBlockCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUserBlockCountResponse.decode(value),
  },
  /** Returns the user's mute count */
  getUserMuteCount: {
    path: "/api_service.v1.ApiService/GetUserMuteCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUserMuteCountRequest) => Buffer.from(GetUserMuteCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUserMuteCountRequest.decode(value),
    responseSerialize: (value: GetUserMuteCountResponse) =>
      Buffer.from(GetUserMuteCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUserMuteCountResponse.decode(value),
  },
  /** Returns the story's data */
  getStory: {
    path: "/api_service.v1.ApiService/GetStory",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetStoryRequest) => Buffer.from(GetStoryRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetStoryRequest.decode(value),
    responseSerialize: (value: GetStoryResponse) => Buffer.from(GetStoryResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetStoryResponse.decode(value),
  },
} as const;

export interface ApiServiceServer extends UntypedServiceImplementation {
  /** Checks whether the user is authenticated using the token from the session cookie */
  getUserId: handleUnaryCall<GetUserIdRequest, GetUserIdResponse>;
  /** Returns the profile page data for a user */
  getProfile: handleUnaryCall<GetProfileRequest, GetProfileResponse>;
  /** Returns the tag page data for a tag */
  getTag: handleUnaryCall<GetTagRequest, GetTagResponse>;
  /** Returns the token using its identifier */
  getToken: handleUnaryCall<GetTokenRequest, GetTokenResponse>;
  /** Verifies a user's email using the provided token identifier */
  verifyEmail: handleUnaryCall<VerifyEmailRequest, VerifyEmailResponse>;
  /** Returns the user's credentials settings */
  getCredentialSettings: handleUnaryCall<GetCredentialSettingsRequest, GetCredentialSettingsResponse>;
  /** Returns the user's privacy settings */
  getPrivacySettings: handleUnaryCall<GetPrivacySettingsRequest, GetPrivacySettingsResponse>;
  /** Returns the user's notification settings */
  getNotificationSettings: handleUnaryCall<GetNotificationSettingsRequest, GetNotificationSettingsResponse>;
  /** Returns the user's connection settings */
  getConnectionSettings: handleUnaryCall<GetConnectionSettingsRequest, GetConnectionSettingsResponse>;
  /** Returns the user's login activity */
  getLoginActivity: handleUnaryCall<GetLoginActivityRequest, GetLoginActivityResponse>;
  /** Returns the user's drafts details */
  getDraftsInfo: handleUnaryCall<GetDraftsInfoRequest, GetDraftsInfoResponse>;
  /** Returns the user's stories details */
  getStoriesInfo: handleUnaryCall<GetStoriesInfoRequest, GetStoriesInfoResponse>;
  /** Returns the user's responses details */
  getResponsesInfo: handleUnaryCall<GetResponsesInfoRequest, GetResponsesInfoResponse>;
  /** Returns the story's responses details */
  getStoryResponsesInfo: handleUnaryCall<GetStoryResponsesInfoRequest, GetStoryResponsesInfoResponse>;
  /** Returns the user's followed tag count */
  getFollowedTagCount: handleUnaryCall<GetFollowedTagCountRequest, GetFollowedTagCountResponse>;
  /** Returns the user's relations details */
  getUserRelationsInfo: handleUnaryCall<GetUserRelationsInfoRequest, GetUserRelationsInfoResponse>;
  /** Returns the user's block count */
  getUserBlockCount: handleUnaryCall<GetUserBlockCountRequest, GetUserBlockCountResponse>;
  /** Returns the user's mute count */
  getUserMuteCount: handleUnaryCall<GetUserMuteCountRequest, GetUserMuteCountResponse>;
  /** Returns the story's data */
  getStory: handleUnaryCall<GetStoryRequest, GetStoryResponse>;
}

export interface ApiServiceClient extends Client {
  /** Checks whether the user is authenticated using the token from the session cookie */
  getUserId(
    request: GetUserIdRequest,
    callback: (error: ServiceError | null, response: GetUserIdResponse) => void,
  ): ClientUnaryCall;
  getUserId(
    request: GetUserIdRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUserIdResponse) => void,
  ): ClientUnaryCall;
  getUserId(
    request: GetUserIdRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUserIdResponse) => void,
  ): ClientUnaryCall;
  /** Returns the profile page data for a user */
  getProfile(
    request: GetProfileRequest,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void,
  ): ClientUnaryCall;
  getProfile(
    request: GetProfileRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void,
  ): ClientUnaryCall;
  getProfile(
    request: GetProfileRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void,
  ): ClientUnaryCall;
  /** Returns the tag page data for a tag */
  getTag(
    request: GetTagRequest,
    callback: (error: ServiceError | null, response: GetTagResponse) => void,
  ): ClientUnaryCall;
  getTag(
    request: GetTagRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTagResponse) => void,
  ): ClientUnaryCall;
  getTag(
    request: GetTagRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTagResponse) => void,
  ): ClientUnaryCall;
  /** Returns the token using its identifier */
  getToken(
    request: GetTokenRequest,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void,
  ): ClientUnaryCall;
  getToken(
    request: GetTokenRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void,
  ): ClientUnaryCall;
  getToken(
    request: GetTokenRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void,
  ): ClientUnaryCall;
  /** Verifies a user's email using the provided token identifier */
  verifyEmail(
    request: VerifyEmailRequest,
    callback: (error: ServiceError | null, response: VerifyEmailResponse) => void,
  ): ClientUnaryCall;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: VerifyEmailResponse) => void,
  ): ClientUnaryCall;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: VerifyEmailResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's credentials settings */
  getCredentialSettings(
    request: GetCredentialSettingsRequest,
    callback: (error: ServiceError | null, response: GetCredentialSettingsResponse) => void,
  ): ClientUnaryCall;
  getCredentialSettings(
    request: GetCredentialSettingsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetCredentialSettingsResponse) => void,
  ): ClientUnaryCall;
  getCredentialSettings(
    request: GetCredentialSettingsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetCredentialSettingsResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's privacy settings */
  getPrivacySettings(
    request: GetPrivacySettingsRequest,
    callback: (error: ServiceError | null, response: GetPrivacySettingsResponse) => void,
  ): ClientUnaryCall;
  getPrivacySettings(
    request: GetPrivacySettingsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetPrivacySettingsResponse) => void,
  ): ClientUnaryCall;
  getPrivacySettings(
    request: GetPrivacySettingsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetPrivacySettingsResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's notification settings */
  getNotificationSettings(
    request: GetNotificationSettingsRequest,
    callback: (error: ServiceError | null, response: GetNotificationSettingsResponse) => void,
  ): ClientUnaryCall;
  getNotificationSettings(
    request: GetNotificationSettingsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetNotificationSettingsResponse) => void,
  ): ClientUnaryCall;
  getNotificationSettings(
    request: GetNotificationSettingsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetNotificationSettingsResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's connection settings */
  getConnectionSettings(
    request: GetConnectionSettingsRequest,
    callback: (error: ServiceError | null, response: GetConnectionSettingsResponse) => void,
  ): ClientUnaryCall;
  getConnectionSettings(
    request: GetConnectionSettingsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetConnectionSettingsResponse) => void,
  ): ClientUnaryCall;
  getConnectionSettings(
    request: GetConnectionSettingsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetConnectionSettingsResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's login activity */
  getLoginActivity(
    request: GetLoginActivityRequest,
    callback: (error: ServiceError | null, response: GetLoginActivityResponse) => void,
  ): ClientUnaryCall;
  getLoginActivity(
    request: GetLoginActivityRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetLoginActivityResponse) => void,
  ): ClientUnaryCall;
  getLoginActivity(
    request: GetLoginActivityRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetLoginActivityResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's drafts details */
  getDraftsInfo(
    request: GetDraftsInfoRequest,
    callback: (error: ServiceError | null, response: GetDraftsInfoResponse) => void,
  ): ClientUnaryCall;
  getDraftsInfo(
    request: GetDraftsInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetDraftsInfoResponse) => void,
  ): ClientUnaryCall;
  getDraftsInfo(
    request: GetDraftsInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetDraftsInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's stories details */
  getStoriesInfo(
    request: GetStoriesInfoRequest,
    callback: (error: ServiceError | null, response: GetStoriesInfoResponse) => void,
  ): ClientUnaryCall;
  getStoriesInfo(
    request: GetStoriesInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetStoriesInfoResponse) => void,
  ): ClientUnaryCall;
  getStoriesInfo(
    request: GetStoriesInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetStoriesInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's responses details */
  getResponsesInfo(
    request: GetResponsesInfoRequest,
    callback: (error: ServiceError | null, response: GetResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  getResponsesInfo(
    request: GetResponsesInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  getResponsesInfo(
    request: GetResponsesInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the story's responses details */
  getStoryResponsesInfo(
    request: GetStoryResponsesInfoRequest,
    callback: (error: ServiceError | null, response: GetStoryResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  getStoryResponsesInfo(
    request: GetStoryResponsesInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetStoryResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  getStoryResponsesInfo(
    request: GetStoryResponsesInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetStoryResponsesInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's followed tag count */
  getFollowedTagCount(
    request: GetFollowedTagCountRequest,
    callback: (error: ServiceError | null, response: GetFollowedTagCountResponse) => void,
  ): ClientUnaryCall;
  getFollowedTagCount(
    request: GetFollowedTagCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetFollowedTagCountResponse) => void,
  ): ClientUnaryCall;
  getFollowedTagCount(
    request: GetFollowedTagCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetFollowedTagCountResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's relations details */
  getUserRelationsInfo(
    request: GetUserRelationsInfoRequest,
    callback: (error: ServiceError | null, response: GetUserRelationsInfoResponse) => void,
  ): ClientUnaryCall;
  getUserRelationsInfo(
    request: GetUserRelationsInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUserRelationsInfoResponse) => void,
  ): ClientUnaryCall;
  getUserRelationsInfo(
    request: GetUserRelationsInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUserRelationsInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's block count */
  getUserBlockCount(
    request: GetUserBlockCountRequest,
    callback: (error: ServiceError | null, response: GetUserBlockCountResponse) => void,
  ): ClientUnaryCall;
  getUserBlockCount(
    request: GetUserBlockCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUserBlockCountResponse) => void,
  ): ClientUnaryCall;
  getUserBlockCount(
    request: GetUserBlockCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUserBlockCountResponse) => void,
  ): ClientUnaryCall;
  /** Returns the user's mute count */
  getUserMuteCount(
    request: GetUserMuteCountRequest,
    callback: (error: ServiceError | null, response: GetUserMuteCountResponse) => void,
  ): ClientUnaryCall;
  getUserMuteCount(
    request: GetUserMuteCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUserMuteCountResponse) => void,
  ): ClientUnaryCall;
  getUserMuteCount(
    request: GetUserMuteCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUserMuteCountResponse) => void,
  ): ClientUnaryCall;
  /** Returns the story's data */
  getStory(
    request: GetStoryRequest,
    callback: (error: ServiceError | null, response: GetStoryResponse) => void,
  ): ClientUnaryCall;
  getStory(
    request: GetStoryRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetStoryResponse) => void,
  ): ClientUnaryCall;
  getStory(
    request: GetStoryRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetStoryResponse) => void,
  ): ClientUnaryCall;
}

export const ApiServiceClient = makeGenericClientConstructor(
  ApiServiceService,
  "api_service.v1.ApiService",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): ApiServiceClient;
  service: typeof ApiServiceService;
};
