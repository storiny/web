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
import _m0 from "protobufjs/minimal";
import {
  GetBlogArchiveRequest,
  GetBlogArchiveResponse,
  GetBlogEditorsInfoRequest,
  GetBlogEditorsInfoResponse,
  GetBlogNewsletterInfoRequest,
  GetBlogNewsletterInfoResponse,
  GetBlogNewsletterRequest,
  GetBlogNewsletterResponse,
  GetBlogPendingStoryCountRequest,
  GetBlogPendingStoryCountResponse,
  GetBlogPublishedStoryCountRequest,
  GetBlogPublishedStoryCountResponse,
  GetBlogRequest,
  GetBlogResponse,
  GetBlogSitemapRequest,
  GetBlogSitemapResponse,
  GetBlogWritersInfoRequest,
  GetBlogWritersInfoResponse,
  GetUserBlogsInfoRequest,
  GetUserBlogsInfoResponse,
} from "../../blog_def/v1/def";
import { GetCommentRequest, GetCommentResponse } from "../../comment_def/v1/def";
import { GetConnectionSettingsRequest, GetConnectionSettingsResponse } from "../../connection_settings_def/v1/def";
import { GetCredentialSettingsRequest, GetCredentialSettingsResponse } from "../../credential_settings_def/v1/def";
import { GetLoginActivityRequest, GetLoginActivityResponse } from "../../login_activity_def/v1/def";
import {
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse,
} from "../../notification_settings_def/v1/def";
import {
  GetStoryOpenGraphDataRequest,
  GetStoryOpenGraphDataResponse,
  GetTagOpenGraphDataRequest,
  GetTagOpenGraphDataResponse,
} from "../../open_graph_def/v1/def";
import { GetPrivacySettingsRequest, GetPrivacySettingsResponse } from "../../privacy_settings_def/v1/def";
import { GetProfileRequest, GetProfileResponse } from "../../profile_def/v1/def";
import {
  GetResponsesInfoRequest,
  GetResponsesInfoResponse,
  GetStoryResponsesInfoRequest,
  GetStoryResponsesInfoResponse,
} from "../../response_def/v1/def";
import {
  CreateDraftRequest,
  CreateDraftResponse,
  GetContributionsInfoRequest,
  GetContributionsInfoResponse,
  GetDraftsInfoRequest,
  GetDraftsInfoResponse,
  GetStoriesInfoRequest,
  GetStoriesInfoResponse,
  GetStoryMetadataRequest,
  GetStoryMetadataResponse,
  GetStoryRequest,
  GetStoryResponse,
  ValidateStoryRequest,
  ValidateStoryResponse,
} from "../../story_def/v1/def";
import {
  GetFollowedTagCountRequest,
  GetFollowedTagCountResponse,
  GetTagRequest,
  GetTagResponse,
} from "../../tag_def/v1/def";
import {
  GetTokenRequest,
  GetTokenResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyNewsletterSubscriptionRequest,
  VerifyNewsletterSubscriptionResponse,
} from "../../token_def/v1/def";
import {
  GetUserBlockCountRequest,
  GetUserBlockCountResponse,
  GetUserIdRequest,
  GetUserIdResponse,
  GetUserMuteCountRequest,
  GetUserMuteCountResponse,
  GetUsernameRequest,
  GetUsernameResponse,
  GetUserRelationsInfoRequest,
  GetUserRelationsInfoResponse,
} from "../../user_def/v1/def";

export const protobufPackage = "api_service.v1";

/** This is necessary to generate an output file using tonic. */
export interface Placeholder {
}

function createBasePlaceholder(): Placeholder {
  return {};
}

export const Placeholder = {
  encode(_: Placeholder, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Placeholder {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlaceholder();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): Placeholder {
    return {};
  },

  toJSON(_: Placeholder): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<Placeholder>, I>>(base?: I): Placeholder {
    return Placeholder.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Placeholder>, I>>(_: I): Placeholder {
    const message = createBasePlaceholder();
    return message;
  },
};

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
  /** Returns the username for a user by its ID */
  getUsername: {
    path: "/api_service.v1.ApiService/GetUsername",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUsernameRequest) => Buffer.from(GetUsernameRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUsernameRequest.decode(value),
    responseSerialize: (value: GetUsernameResponse) => Buffer.from(GetUsernameResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUsernameResponse.decode(value),
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
  /** Verifies a visitor's newsletter subscription request using the provided token identifier */
  verifyNewsletterSubscription: {
    path: "/api_service.v1.ApiService/VerifyNewsletterSubscription",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: VerifyNewsletterSubscriptionRequest) =>
      Buffer.from(VerifyNewsletterSubscriptionRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => VerifyNewsletterSubscriptionRequest.decode(value),
    responseSerialize: (value: VerifyNewsletterSubscriptionResponse) =>
      Buffer.from(VerifyNewsletterSubscriptionResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => VerifyNewsletterSubscriptionResponse.decode(value),
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
  /** Validates a story */
  validateStory: {
    path: "/api_service.v1.ApiService/ValidateStory",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ValidateStoryRequest) => Buffer.from(ValidateStoryRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ValidateStoryRequest.decode(value),
    responseSerialize: (value: ValidateStoryResponse) => Buffer.from(ValidateStoryResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ValidateStoryResponse.decode(value),
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
  /** Returns the user's contributions details */
  getContributionsInfo: {
    path: "/api_service.v1.ApiService/GetContributionsInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetContributionsInfoRequest) =>
      Buffer.from(GetContributionsInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetContributionsInfoRequest.decode(value),
    responseSerialize: (value: GetContributionsInfoResponse) =>
      Buffer.from(GetContributionsInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetContributionsInfoResponse.decode(value),
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
  /** Returns the user's blogs details */
  getUserBlogsInfo: {
    path: "/api_service.v1.ApiService/GetUserBlogsInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUserBlogsInfoRequest) => Buffer.from(GetUserBlogsInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUserBlogsInfoRequest.decode(value),
    responseSerialize: (value: GetUserBlogsInfoResponse) =>
      Buffer.from(GetUserBlogsInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUserBlogsInfoResponse.decode(value),
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
  /** Returns the story's metadata */
  getStoryMetadata: {
    path: "/api_service.v1.ApiService/GetStoryMetadata",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetStoryMetadataRequest) => Buffer.from(GetStoryMetadataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetStoryMetadataRequest.decode(value),
    responseSerialize: (value: GetStoryMetadataResponse) =>
      Buffer.from(GetStoryMetadataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetStoryMetadataResponse.decode(value),
  },
  /** Returns the comment's data */
  getComment: {
    path: "/api_service.v1.ApiService/GetComment",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetCommentRequest) => Buffer.from(GetCommentRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetCommentRequest.decode(value),
    responseSerialize: (value: GetCommentResponse) => Buffer.from(GetCommentResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetCommentResponse.decode(value),
  },
  /** Creates a new draft */
  createDraft: {
    path: "/api_service.v1.ApiService/CreateDraft",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: CreateDraftRequest) => Buffer.from(CreateDraftRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => CreateDraftRequest.decode(value),
    responseSerialize: (value: CreateDraftResponse) => Buffer.from(CreateDraftResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => CreateDraftResponse.decode(value),
  },
  /** Returns the blog's data */
  getBlog: {
    path: "/api_service.v1.ApiService/GetBlog",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogRequest) => Buffer.from(GetBlogRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogRequest.decode(value),
    responseSerialize: (value: GetBlogResponse) => Buffer.from(GetBlogResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogResponse.decode(value),
  },
  /** Returns the blog's archive data */
  getBlogArchive: {
    path: "/api_service.v1.ApiService/GetBlogArchive",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogArchiveRequest) => Buffer.from(GetBlogArchiveRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogArchiveRequest.decode(value),
    responseSerialize: (value: GetBlogArchiveResponse) => Buffer.from(GetBlogArchiveResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogArchiveResponse.decode(value),
  },
  /** Returns the blog's pending story count */
  getBlogPendingStoryCount: {
    path: "/api_service.v1.ApiService/GetBlogPendingStoryCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogPendingStoryCountRequest) =>
      Buffer.from(GetBlogPendingStoryCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogPendingStoryCountRequest.decode(value),
    responseSerialize: (value: GetBlogPendingStoryCountResponse) =>
      Buffer.from(GetBlogPendingStoryCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogPendingStoryCountResponse.decode(value),
  },
  /** Returns the blog's published story count */
  getBlogPublishedStoryCount: {
    path: "/api_service.v1.ApiService/GetBlogPublishedStoryCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogPublishedStoryCountRequest) =>
      Buffer.from(GetBlogPublishedStoryCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogPublishedStoryCountRequest.decode(value),
    responseSerialize: (value: GetBlogPublishedStoryCountResponse) =>
      Buffer.from(GetBlogPublishedStoryCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogPublishedStoryCountResponse.decode(value),
  },
  /** Returns the blog's editors details */
  getBlogEditorsInfo: {
    path: "/api_service.v1.ApiService/GetBlogEditorsInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogEditorsInfoRequest) =>
      Buffer.from(GetBlogEditorsInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogEditorsInfoRequest.decode(value),
    responseSerialize: (value: GetBlogEditorsInfoResponse) =>
      Buffer.from(GetBlogEditorsInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogEditorsInfoResponse.decode(value),
  },
  /** Returns the blog's writers details */
  getBlogWritersInfo: {
    path: "/api_service.v1.ApiService/GetBlogWritersInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogWritersInfoRequest) =>
      Buffer.from(GetBlogWritersInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogWritersInfoRequest.decode(value),
    responseSerialize: (value: GetBlogWritersInfoResponse) =>
      Buffer.from(GetBlogWritersInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogWritersInfoResponse.decode(value),
  },
  /** Returns the blog's sitemap */
  getBlogSitemap: {
    path: "/api_service.v1.ApiService/GetBlogSitemap",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogSitemapRequest) => Buffer.from(GetBlogSitemapRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogSitemapRequest.decode(value),
    responseSerialize: (value: GetBlogSitemapResponse) => Buffer.from(GetBlogSitemapResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogSitemapResponse.decode(value),
  },
  /** Returns the blog's newsletter */
  getBlogNewsletter: {
    path: "/api_service.v1.ApiService/GetBlogNewsletter",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogNewsletterRequest) => Buffer.from(GetBlogNewsletterRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogNewsletterRequest.decode(value),
    responseSerialize: (value: GetBlogNewsletterResponse) =>
      Buffer.from(GetBlogNewsletterResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogNewsletterResponse.decode(value),
  },
  /** Returns the blog's newsletter details */
  getBlogNewsletterInfo: {
    path: "/api_service.v1.ApiService/GetBlogNewsletterInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetBlogNewsletterInfoRequest) =>
      Buffer.from(GetBlogNewsletterInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetBlogNewsletterInfoRequest.decode(value),
    responseSerialize: (value: GetBlogNewsletterInfoResponse) =>
      Buffer.from(GetBlogNewsletterInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetBlogNewsletterInfoResponse.decode(value),
  },
  /** Returns the story's open graph data */
  getStoryOpenGraphData: {
    path: "/api_service.v1.ApiService/GetStoryOpenGraphData",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetStoryOpenGraphDataRequest) =>
      Buffer.from(GetStoryOpenGraphDataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetStoryOpenGraphDataRequest.decode(value),
    responseSerialize: (value: GetStoryOpenGraphDataResponse) =>
      Buffer.from(GetStoryOpenGraphDataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetStoryOpenGraphDataResponse.decode(value),
  },
  /** Returns the tag's open graph data */
  getTagOpenGraphData: {
    path: "/api_service.v1.ApiService/GetTagOpenGraphData",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTagOpenGraphDataRequest) =>
      Buffer.from(GetTagOpenGraphDataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTagOpenGraphDataRequest.decode(value),
    responseSerialize: (value: GetTagOpenGraphDataResponse) =>
      Buffer.from(GetTagOpenGraphDataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTagOpenGraphDataResponse.decode(value),
  },
} as const;

export interface ApiServiceServer extends UntypedServiceImplementation {
  /** Checks whether the user is authenticated using the token from the session cookie */
  getUserId: handleUnaryCall<GetUserIdRequest, GetUserIdResponse>;
  /** Returns the username for a user by its ID */
  getUsername: handleUnaryCall<GetUsernameRequest, GetUsernameResponse>;
  /** Returns the profile page data for a user */
  getProfile: handleUnaryCall<GetProfileRequest, GetProfileResponse>;
  /** Returns the tag page data for a tag */
  getTag: handleUnaryCall<GetTagRequest, GetTagResponse>;
  /** Returns the token using its identifier */
  getToken: handleUnaryCall<GetTokenRequest, GetTokenResponse>;
  /** Verifies a user's email using the provided token identifier */
  verifyEmail: handleUnaryCall<VerifyEmailRequest, VerifyEmailResponse>;
  /** Verifies a visitor's newsletter subscription request using the provided token identifier */
  verifyNewsletterSubscription: handleUnaryCall<
    VerifyNewsletterSubscriptionRequest,
    VerifyNewsletterSubscriptionResponse
  >;
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
  /** Validates a story */
  validateStory: handleUnaryCall<ValidateStoryRequest, ValidateStoryResponse>;
  /** Returns the user's drafts details */
  getDraftsInfo: handleUnaryCall<GetDraftsInfoRequest, GetDraftsInfoResponse>;
  /** Returns the user's stories details */
  getStoriesInfo: handleUnaryCall<GetStoriesInfoRequest, GetStoriesInfoResponse>;
  /** Returns the user's contributions details */
  getContributionsInfo: handleUnaryCall<GetContributionsInfoRequest, GetContributionsInfoResponse>;
  /** Returns the user's responses details */
  getResponsesInfo: handleUnaryCall<GetResponsesInfoRequest, GetResponsesInfoResponse>;
  /** Returns the story's responses details */
  getStoryResponsesInfo: handleUnaryCall<GetStoryResponsesInfoRequest, GetStoryResponsesInfoResponse>;
  /** Returns the user's followed tag count */
  getFollowedTagCount: handleUnaryCall<GetFollowedTagCountRequest, GetFollowedTagCountResponse>;
  /** Returns the user's relations details */
  getUserRelationsInfo: handleUnaryCall<GetUserRelationsInfoRequest, GetUserRelationsInfoResponse>;
  /** Returns the user's blogs details */
  getUserBlogsInfo: handleUnaryCall<GetUserBlogsInfoRequest, GetUserBlogsInfoResponse>;
  /** Returns the user's block count */
  getUserBlockCount: handleUnaryCall<GetUserBlockCountRequest, GetUserBlockCountResponse>;
  /** Returns the user's mute count */
  getUserMuteCount: handleUnaryCall<GetUserMuteCountRequest, GetUserMuteCountResponse>;
  /** Returns the story's data */
  getStory: handleUnaryCall<GetStoryRequest, GetStoryResponse>;
  /** Returns the story's metadata */
  getStoryMetadata: handleUnaryCall<GetStoryMetadataRequest, GetStoryMetadataResponse>;
  /** Returns the comment's data */
  getComment: handleUnaryCall<GetCommentRequest, GetCommentResponse>;
  /** Creates a new draft */
  createDraft: handleUnaryCall<CreateDraftRequest, CreateDraftResponse>;
  /** Returns the blog's data */
  getBlog: handleUnaryCall<GetBlogRequest, GetBlogResponse>;
  /** Returns the blog's archive data */
  getBlogArchive: handleUnaryCall<GetBlogArchiveRequest, GetBlogArchiveResponse>;
  /** Returns the blog's pending story count */
  getBlogPendingStoryCount: handleUnaryCall<GetBlogPendingStoryCountRequest, GetBlogPendingStoryCountResponse>;
  /** Returns the blog's published story count */
  getBlogPublishedStoryCount: handleUnaryCall<GetBlogPublishedStoryCountRequest, GetBlogPublishedStoryCountResponse>;
  /** Returns the blog's editors details */
  getBlogEditorsInfo: handleUnaryCall<GetBlogEditorsInfoRequest, GetBlogEditorsInfoResponse>;
  /** Returns the blog's writers details */
  getBlogWritersInfo: handleUnaryCall<GetBlogWritersInfoRequest, GetBlogWritersInfoResponse>;
  /** Returns the blog's sitemap */
  getBlogSitemap: handleUnaryCall<GetBlogSitemapRequest, GetBlogSitemapResponse>;
  /** Returns the blog's newsletter */
  getBlogNewsletter: handleUnaryCall<GetBlogNewsletterRequest, GetBlogNewsletterResponse>;
  /** Returns the blog's newsletter details */
  getBlogNewsletterInfo: handleUnaryCall<GetBlogNewsletterInfoRequest, GetBlogNewsletterInfoResponse>;
  /** Returns the story's open graph data */
  getStoryOpenGraphData: handleUnaryCall<GetStoryOpenGraphDataRequest, GetStoryOpenGraphDataResponse>;
  /** Returns the tag's open graph data */
  getTagOpenGraphData: handleUnaryCall<GetTagOpenGraphDataRequest, GetTagOpenGraphDataResponse>;
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
  /** Returns the username for a user by its ID */
  getUsername(
    request: GetUsernameRequest,
    callback: (error: ServiceError | null, response: GetUsernameResponse) => void,
  ): ClientUnaryCall;
  getUsername(
    request: GetUsernameRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUsernameResponse) => void,
  ): ClientUnaryCall;
  getUsername(
    request: GetUsernameRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUsernameResponse) => void,
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
  /** Verifies a visitor's newsletter subscription request using the provided token identifier */
  verifyNewsletterSubscription(
    request: VerifyNewsletterSubscriptionRequest,
    callback: (error: ServiceError | null, response: VerifyNewsletterSubscriptionResponse) => void,
  ): ClientUnaryCall;
  verifyNewsletterSubscription(
    request: VerifyNewsletterSubscriptionRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: VerifyNewsletterSubscriptionResponse) => void,
  ): ClientUnaryCall;
  verifyNewsletterSubscription(
    request: VerifyNewsletterSubscriptionRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: VerifyNewsletterSubscriptionResponse) => void,
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
  /** Validates a story */
  validateStory(
    request: ValidateStoryRequest,
    callback: (error: ServiceError | null, response: ValidateStoryResponse) => void,
  ): ClientUnaryCall;
  validateStory(
    request: ValidateStoryRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ValidateStoryResponse) => void,
  ): ClientUnaryCall;
  validateStory(
    request: ValidateStoryRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ValidateStoryResponse) => void,
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
  /** Returns the user's contributions details */
  getContributionsInfo(
    request: GetContributionsInfoRequest,
    callback: (error: ServiceError | null, response: GetContributionsInfoResponse) => void,
  ): ClientUnaryCall;
  getContributionsInfo(
    request: GetContributionsInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetContributionsInfoResponse) => void,
  ): ClientUnaryCall;
  getContributionsInfo(
    request: GetContributionsInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetContributionsInfoResponse) => void,
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
  /** Returns the user's blogs details */
  getUserBlogsInfo(
    request: GetUserBlogsInfoRequest,
    callback: (error: ServiceError | null, response: GetUserBlogsInfoResponse) => void,
  ): ClientUnaryCall;
  getUserBlogsInfo(
    request: GetUserBlogsInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUserBlogsInfoResponse) => void,
  ): ClientUnaryCall;
  getUserBlogsInfo(
    request: GetUserBlogsInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUserBlogsInfoResponse) => void,
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
  /** Returns the story's metadata */
  getStoryMetadata(
    request: GetStoryMetadataRequest,
    callback: (error: ServiceError | null, response: GetStoryMetadataResponse) => void,
  ): ClientUnaryCall;
  getStoryMetadata(
    request: GetStoryMetadataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetStoryMetadataResponse) => void,
  ): ClientUnaryCall;
  getStoryMetadata(
    request: GetStoryMetadataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetStoryMetadataResponse) => void,
  ): ClientUnaryCall;
  /** Returns the comment's data */
  getComment(
    request: GetCommentRequest,
    callback: (error: ServiceError | null, response: GetCommentResponse) => void,
  ): ClientUnaryCall;
  getComment(
    request: GetCommentRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetCommentResponse) => void,
  ): ClientUnaryCall;
  getComment(
    request: GetCommentRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetCommentResponse) => void,
  ): ClientUnaryCall;
  /** Creates a new draft */
  createDraft(
    request: CreateDraftRequest,
    callback: (error: ServiceError | null, response: CreateDraftResponse) => void,
  ): ClientUnaryCall;
  createDraft(
    request: CreateDraftRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: CreateDraftResponse) => void,
  ): ClientUnaryCall;
  createDraft(
    request: CreateDraftRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: CreateDraftResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's data */
  getBlog(
    request: GetBlogRequest,
    callback: (error: ServiceError | null, response: GetBlogResponse) => void,
  ): ClientUnaryCall;
  getBlog(
    request: GetBlogRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogResponse) => void,
  ): ClientUnaryCall;
  getBlog(
    request: GetBlogRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's archive data */
  getBlogArchive(
    request: GetBlogArchiveRequest,
    callback: (error: ServiceError | null, response: GetBlogArchiveResponse) => void,
  ): ClientUnaryCall;
  getBlogArchive(
    request: GetBlogArchiveRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogArchiveResponse) => void,
  ): ClientUnaryCall;
  getBlogArchive(
    request: GetBlogArchiveRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogArchiveResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's pending story count */
  getBlogPendingStoryCount(
    request: GetBlogPendingStoryCountRequest,
    callback: (error: ServiceError | null, response: GetBlogPendingStoryCountResponse) => void,
  ): ClientUnaryCall;
  getBlogPendingStoryCount(
    request: GetBlogPendingStoryCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogPendingStoryCountResponse) => void,
  ): ClientUnaryCall;
  getBlogPendingStoryCount(
    request: GetBlogPendingStoryCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogPendingStoryCountResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's published story count */
  getBlogPublishedStoryCount(
    request: GetBlogPublishedStoryCountRequest,
    callback: (error: ServiceError | null, response: GetBlogPublishedStoryCountResponse) => void,
  ): ClientUnaryCall;
  getBlogPublishedStoryCount(
    request: GetBlogPublishedStoryCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogPublishedStoryCountResponse) => void,
  ): ClientUnaryCall;
  getBlogPublishedStoryCount(
    request: GetBlogPublishedStoryCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogPublishedStoryCountResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's editors details */
  getBlogEditorsInfo(
    request: GetBlogEditorsInfoRequest,
    callback: (error: ServiceError | null, response: GetBlogEditorsInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogEditorsInfo(
    request: GetBlogEditorsInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogEditorsInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogEditorsInfo(
    request: GetBlogEditorsInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogEditorsInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's writers details */
  getBlogWritersInfo(
    request: GetBlogWritersInfoRequest,
    callback: (error: ServiceError | null, response: GetBlogWritersInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogWritersInfo(
    request: GetBlogWritersInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogWritersInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogWritersInfo(
    request: GetBlogWritersInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogWritersInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's sitemap */
  getBlogSitemap(
    request: GetBlogSitemapRequest,
    callback: (error: ServiceError | null, response: GetBlogSitemapResponse) => void,
  ): ClientUnaryCall;
  getBlogSitemap(
    request: GetBlogSitemapRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogSitemapResponse) => void,
  ): ClientUnaryCall;
  getBlogSitemap(
    request: GetBlogSitemapRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogSitemapResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's newsletter */
  getBlogNewsletter(
    request: GetBlogNewsletterRequest,
    callback: (error: ServiceError | null, response: GetBlogNewsletterResponse) => void,
  ): ClientUnaryCall;
  getBlogNewsletter(
    request: GetBlogNewsletterRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogNewsletterResponse) => void,
  ): ClientUnaryCall;
  getBlogNewsletter(
    request: GetBlogNewsletterRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogNewsletterResponse) => void,
  ): ClientUnaryCall;
  /** Returns the blog's newsletter details */
  getBlogNewsletterInfo(
    request: GetBlogNewsletterInfoRequest,
    callback: (error: ServiceError | null, response: GetBlogNewsletterInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogNewsletterInfo(
    request: GetBlogNewsletterInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetBlogNewsletterInfoResponse) => void,
  ): ClientUnaryCall;
  getBlogNewsletterInfo(
    request: GetBlogNewsletterInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetBlogNewsletterInfoResponse) => void,
  ): ClientUnaryCall;
  /** Returns the story's open graph data */
  getStoryOpenGraphData(
    request: GetStoryOpenGraphDataRequest,
    callback: (error: ServiceError | null, response: GetStoryOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
  getStoryOpenGraphData(
    request: GetStoryOpenGraphDataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetStoryOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
  getStoryOpenGraphData(
    request: GetStoryOpenGraphDataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetStoryOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
  /** Returns the tag's open graph data */
  getTagOpenGraphData(
    request: GetTagOpenGraphDataRequest,
    callback: (error: ServiceError | null, response: GetTagOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
  getTagOpenGraphData(
    request: GetTagOpenGraphDataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTagOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
  getTagOpenGraphData(
    request: GetTagOpenGraphDataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTagOpenGraphDataResponse) => void,
  ): ClientUnaryCall;
}

export const ApiServiceClient = makeGenericClientConstructor(
  ApiServiceService,
  "api_service.v1.ApiService",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): ApiServiceClient;
  service: typeof ApiServiceService;
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };
