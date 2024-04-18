// noinspection ES6ConvertVarToLetConst

import "server-only";

import {
  credentials,
  InterceptingCall,
  Interceptor,
  RequesterBuilder,
  ServiceError
} from "@grpc/grpc-js";
import { CompressionAlgorithms } from "@grpc/grpc-js/build/src/compression-algorithms";
import { ApiServiceClient } from "@storiny/proto/dist/api_service/v1/service";
import {
  GetBlogArchiveRequest,
  GetBlogArchiveResponse,
  GetBlogEditorsInfoRequest,
  GetBlogEditorsInfoResponse,
  GetBlogNewsletterInfoRequest,
  GetBlogNewsletterInfoResponse,
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
  GetUserBlogsInfoResponse} from "@storiny/proto/dist/blog_def/v1/def";
import {
  GetCommentRequest,
  GetCommentResponse
} from "@storiny/proto/dist/comment_def/v1/def";
import {
  GetConnectionSettingsRequest,
  GetConnectionSettingsResponse
} from "@storiny/proto/dist/connection_settings_def/v1/def";
import {
  GetCredentialSettingsRequest,
  GetCredentialSettingsResponse
} from "@storiny/proto/dist/credential_settings_def/v1/def";
import {
  GetLoginActivityRequest,
  GetLoginActivityResponse
} from "@storiny/proto/dist/login_activity_def/v1/def";
import {
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse
} from "@storiny/proto/dist/notification_settings_def/v1/def";
import {
  GetPrivacySettingsRequest,
  GetPrivacySettingsResponse
} from "@storiny/proto/dist/privacy_settings_def/v1/def";
import {
  GetProfileRequest,
  GetProfileResponse
} from "@storiny/proto/dist/profile_def/v1/def";
import {
  GetResponsesInfoRequest,
  GetResponsesInfoResponse,
  GetStoryResponsesInfoRequest,
  GetStoryResponsesInfoResponse
} from "@storiny/proto/dist/response_def/v1/def";
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
  ValidateStoryResponse
} from "@storiny/proto/dist/story_def/v1/def";
import {
  GetFollowedTagCountRequest,
  GetFollowedTagCountResponse,
  GetTagRequest,
  GetTagResponse
} from "@storiny/proto/dist/tag_def/v1/def";
import {
  GetTokenRequest,
  GetTokenResponse,
  VerifyEmailRequest,
  VerifyEmailResponse
} from "@storiny/proto/dist/token_def/v1/def";
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
  GetUserRelationsInfoResponse
} from "@storiny/proto/dist/user_def/v1/def";
import { cache } from "react";

declare global {
  /* eslint-disable no-var */
  var grpc_client: InstanceType<typeof ApiServiceClient>;
  /* eslint-enable no-var */
}

/**
 * Converts callback style function to a promise
 * @param callback Callback style function to promisify
 */
const promisify =
  <Req, Res>(callback: (...args: any) => any) =>
  (payload: Req): Promise<Res> =>
    new Promise((resolve, reject) => {
      callback.bind(global.grpc_client)(
        payload,
        (err: ServiceError | null, response: Res) => {
          if (err) {
            reject(err);
          }
          resolve(response);
        }
      );
    });

/**
 * Authentication interceptor for the channel.
 */
const auth_interceptor: Interceptor = (options, next_call) => {
  const requester = new RequesterBuilder()
    .withStart((metadata, listener, next) => {
      metadata.set("authorization", `Bearer ${process.env.GRPC_SECRET_TOKEN}`);
      next(metadata, listener);
    })
    .build();

  return new InterceptingCall(next_call(options), requester);
};

global.grpc_client = new ApiServiceClient(
  process.env.GRPC_ENDPOINT as string,
  credentials.createInsecure(),
  {
    interceptors: [auth_interceptor],
    "grpc.default_compression_algorithm": CompressionAlgorithms.gzip
  }
);

const grpc_hub = {
  create_draft: cache(
    promisify<CreateDraftRequest, CreateDraftResponse>(
      global.grpc_client.createDraft
    )
  ),
  get_comment: cache(
    promisify<GetCommentRequest, GetCommentResponse>(
      global.grpc_client.getComment
    )
  ),
  get_connection_settings: cache(
    promisify<GetConnectionSettingsRequest, GetConnectionSettingsResponse>(
      global.grpc_client.getConnectionSettings
    )
  ),
  get_contributions_info: cache(
    promisify<GetContributionsInfoRequest, GetContributionsInfoResponse>(
      global.grpc_client.getContributionsInfo
    )
  ),
  get_credential_settings: cache(
    promisify<GetCredentialSettingsRequest, GetCredentialSettingsResponse>(
      global.grpc_client.getCredentialSettings
    )
  ),
  get_drafts_info: cache(
    promisify<GetDraftsInfoRequest, GetDraftsInfoResponse>(
      global.grpc_client.getDraftsInfo
    )
  ),
  get_followed_tag_count: cache(
    promisify<GetFollowedTagCountRequest, GetFollowedTagCountResponse>(
      global.grpc_client.getFollowedTagCount
    )
  ),
  get_login_activity: cache(
    promisify<GetLoginActivityRequest, GetLoginActivityResponse>(
      global.grpc_client.getLoginActivity
    )
  ),
  get_notification_settings: cache(
    promisify<GetNotificationSettingsRequest, GetNotificationSettingsResponse>(
      global.grpc_client.getNotificationSettings
    )
  ),
  get_privacy_settings: cache(
    promisify<GetPrivacySettingsRequest, GetPrivacySettingsResponse>(
      global.grpc_client.getPrivacySettings
    )
  ),
  get_profile: cache(
    promisify<GetProfileRequest, GetProfileResponse>(
      global.grpc_client.getProfile
    )
  ),
  get_responses_info: cache(
    promisify<GetResponsesInfoRequest, GetResponsesInfoResponse>(
      global.grpc_client.getResponsesInfo
    )
  ),
  get_stories_info: cache(
    promisify<GetStoriesInfoRequest, GetStoriesInfoResponse>(
      global.grpc_client.getStoriesInfo
    )
  ),
  get_story: cache(
    promisify<GetStoryRequest, GetStoryResponse>(global.grpc_client.getStory)
  ),
  get_story_metadata: cache(
    promisify<GetStoryMetadataRequest, GetStoryMetadataResponse>(
      global.grpc_client.getStoryMetadata
    )
  ),
  get_story_responses_info: cache(
    promisify<GetStoryResponsesInfoRequest, GetStoryResponsesInfoResponse>(
      global.grpc_client.getStoryResponsesInfo
    )
  ),
  get_tag: cache(
    promisify<GetTagRequest, GetTagResponse>(global.grpc_client.getTag)
  ),
  get_token: cache(
    promisify<GetTokenRequest, GetTokenResponse>(global.grpc_client.getToken)
  ),
  get_user_block_count: cache(
    promisify<GetUserBlockCountRequest, GetUserBlockCountResponse>(
      global.grpc_client.getUserBlockCount
    )
  ),
  get_user_id: cache(
    promisify<GetUserIdRequest, GetUserIdResponse>(global.grpc_client.getUserId)
  ),
  get_user_mute_count: cache(
    promisify<GetUserMuteCountRequest, GetUserMuteCountResponse>(
      global.grpc_client.getUserMuteCount
    )
  ),
  get_user_relations_info: cache(
    promisify<GetUserRelationsInfoRequest, GetUserRelationsInfoResponse>(
      global.grpc_client.getUserRelationsInfo
    )
  ),
  get_user_blogs_info: cache(
    promisify<GetUserBlogsInfoRequest, GetUserBlogsInfoResponse>(
      global.grpc_client.getUserBlogsInfo
    )
  ),
  get_username: cache(
    promisify<GetUsernameRequest, GetUsernameResponse>(
      global.grpc_client.getUsername
    )
  ),
  validate_story: cache(
    promisify<ValidateStoryRequest, ValidateStoryResponse>(
      global.grpc_client.validateStory
    )
  ),
  verify_email: cache(
    promisify<VerifyEmailRequest, VerifyEmailResponse>(
      global.grpc_client.verifyEmail
    )
  ),
  get_blog: cache(
    promisify<GetBlogRequest, GetBlogResponse>(global.grpc_client.getBlog)
  ),
  get_blog_archive: cache(
    promisify<GetBlogArchiveRequest, GetBlogArchiveResponse>(
      global.grpc_client.getBlogArchive
    )
  ),
  get_blog_pending_story_count: cache(
    promisify<
      GetBlogPendingStoryCountRequest,
      GetBlogPendingStoryCountResponse
    >(global.grpc_client.getBlogPendingStoryCount)
  ),
  get_blog_published_story_count: cache(
    promisify<
      GetBlogPublishedStoryCountRequest,
      GetBlogPublishedStoryCountResponse
    >(global.grpc_client.getBlogPublishedStoryCount)
  ),
  get_blog_editors_info: cache(
    promisify<GetBlogEditorsInfoRequest, GetBlogEditorsInfoResponse>(
      global.grpc_client.getBlogEditorsInfo
    )
  ),
  get_blog_writers_info: cache(
    promisify<GetBlogWritersInfoRequest, GetBlogWritersInfoResponse>(
      global.grpc_client.getBlogWritersInfo
    )
  ),
  get_blog_newsletter_info: cache(
    promisify<GetBlogNewsletterInfoRequest, GetBlogNewsletterInfoResponse>(
      global.grpc_client.getBlogNewsletterInfo
    )
  ),
  get_blog_sitemap: cache(
    promisify<GetBlogSitemapRequest, GetBlogSitemapResponse>(
      global.grpc_client.getBlogSitemap
    )
  )
} as const;

global.grpc_hub = grpc_hub;

export const {
  get_notification_settings,
  get_credential_settings,
  get_connection_settings,
  get_privacy_settings,
  get_contributions_info,
  get_drafts_info,
  get_responses_info,
  get_story_responses_info,
  get_story_metadata,
  get_stories_info,
  validate_story,
  get_story,
  get_user_relations_info,
  get_user_id,
  get_user_block_count,
  get_user_mute_count,
  get_followed_tag_count,
  get_tag,
  get_login_activity,
  get_token,
  get_profile,
  get_user_blogs_info,
  create_draft,
  verify_email,
  get_comment,
  get_username,
  get_blog,
  get_blog_archive,
  get_blog_pending_story_count,
  get_blog_published_story_count,
  get_blog_editors_info,
  get_blog_writers_info,
  get_blog_sitemap,
  get_blog_newsletter_info
} = global.grpc_hub as typeof grpc_hub;

export {
  CreateDraftResponse,
  GetBlogArchiveResponse,
  GetBlogEditorsInfoResponse,
  GetBlogNewsletterInfoResponse,
  GetBlogPendingStoryCountResponse,
  GetBlogPublishedStoryCountResponse,
  GetBlogResponse,
  GetBlogSitemapResponse,
  GetBlogWritersInfoResponse,
  GetCommentResponse,
  GetConnectionSettingsResponse,
  GetContributionsInfoResponse,
  GetCredentialSettingsResponse,
  GetDraftsInfoResponse,
  GetFollowedTagCountResponse,
  GetLoginActivityResponse,
  GetNotificationSettingsResponse,
  GetPrivacySettingsResponse,
  GetProfileResponse,
  GetResponsesInfoResponse,
  GetStoriesInfoResponse,
  GetStoryMetadataResponse,
  GetStoryResponse,
  GetStoryResponsesInfoResponse,
  GetTagResponse,
  GetTokenResponse,
  GetUserBlockCountResponse,
  GetUserBlogsInfoResponse,
  GetUserIdResponse,
  GetUserMuteCountResponse,
  GetUsernameResponse,
  GetUserRelationsInfoResponse,
  ValidateStoryResponse,
  VerifyEmailResponse
};
