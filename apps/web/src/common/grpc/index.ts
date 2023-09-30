import "server-only";

import { credentials, ServiceError } from "@grpc/grpc-js";
import { ApiServiceClient } from "@storiny/proto/gen/ts/api_service/v1/service";
import {
  GetConnectionSettingsRequest,
  GetConnectionSettingsResponse
} from "@storiny/proto/gen/ts/connection_settings_def/v1/def";
import {
  GetCredentialSettingsRequest,
  GetCredentialSettingsResponse
} from "@storiny/proto/gen/ts/credential_settings_def/v1/def";
import {
  GetLoginActivityRequest,
  GetLoginActivityResponse
} from "@storiny/proto/gen/ts/login_activity_def/v1/def";
import {
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse
} from "@storiny/proto/gen/ts/notification_settings_def/v1/def";
import {
  GetPrivacySettingsRequest,
  GetPrivacySettingsResponse
} from "@storiny/proto/gen/ts/privacy_settings_def/v1/def";
import {
  GetProfileRequest,
  GetProfileResponse
} from "@storiny/proto/gen/ts/profile_def/v1/def";
import {
  GetResponsesInfoRequest,
  GetResponsesInfoResponse,
  GetStoryResponsesInfoRequest,
  GetStoryResponsesInfoResponse
} from "@storiny/proto/gen/ts/response_def/v1/def";
import {
  GetDraftsInfoRequest,
  GetDraftsInfoResponse,
  GetStoriesInfoRequest,
  GetStoriesInfoResponse,
  GetStoryRequest,
  GetStoryResponse
} from "@storiny/proto/gen/ts/story_def/v1/def";
import {
  GetFollowedTagCountRequest,
  GetFollowedTagCountResponse,
  GetTagRequest,
  GetTagResponse
} from "@storiny/proto/gen/ts/tag_def/v1/def";
import {
  GetTokenRequest,
  GetTokenResponse,
  VerifyEmailRequest,
  VerifyEmailResponse
} from "@storiny/proto/gen/ts/token_def/v1/def";
import {
  GetUserBlockCountRequest,
  GetUserBlockCountResponse,
  GetUserIdRequest,
  GetUserIdResponse,
  GetUserMuteCountRequest,
  GetUserMuteCountResponse,
  GetUserRelationsInfoRequest,
  GetUserRelationsInfoResponse
} from "@storiny/proto/gen/ts/user_def/v1/def";
import { cache } from "react";

declare global {
  /* eslint-disable no-var */
  // noinspection ES6ConvertVarToLetConst
  var grpc_client: InstanceType<typeof ApiServiceClient>;
  /* eslint-enable no-var */
}

global.grpc_client = new ApiServiceClient(
  process.env.RPC_ENDPOINT as string,
  credentials.createInsecure()
);

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

export {
  GetConnectionSettingsResponse,
  GetCredentialSettingsResponse,
  GetDraftsInfoResponse,
  GetFollowedTagCountResponse,
  GetLoginActivityResponse,
  GetNotificationSettingsResponse,
  GetPrivacySettingsResponse,
  GetProfileResponse,
  GetResponsesInfoResponse,
  GetStoriesInfoResponse,
  GetStoryResponse,
  GetStoryResponsesInfoResponse,
  GetTagResponse,
  GetTokenResponse,
  GetUserBlockCountResponse,
  GetUserIdResponse,
  GetUserMuteCountResponse,
  GetUserRelationsInfoResponse,
  VerifyEmailResponse
};

export const get_user_id = cache(
  promisify<GetUserIdRequest, GetUserIdResponse>(global.grpc_client.getUserId)
);

export const get_credential_settings = cache(
  promisify<GetCredentialSettingsRequest, GetCredentialSettingsResponse>(
    global.grpc_client.getCredentialSettings
  )
);

export const get_privacy_settings = cache(
  promisify<GetPrivacySettingsRequest, GetPrivacySettingsResponse>(
    global.grpc_client.getPrivacySettings
  )
);

export const get_notification_settings = cache(
  promisify<GetNotificationSettingsRequest, GetNotificationSettingsResponse>(
    global.grpc_client.getNotificationSettings
  )
);

export const get_connection_settings = cache(
  promisify<GetConnectionSettingsRequest, GetConnectionSettingsResponse>(
    global.grpc_client.getConnectionSettings
  )
);

export const get_login_activity = cache(
  promisify<GetLoginActivityRequest, GetLoginActivityResponse>(
    global.grpc_client.getLoginActivity
  )
);

export const get_drafts_info = cache(
  promisify<GetDraftsInfoRequest, GetDraftsInfoResponse>(
    global.grpc_client.getDraftsInfo
  )
);

export const get_stories_info = cache(
  promisify<GetStoriesInfoRequest, GetStoriesInfoResponse>(
    global.grpc_client.getStoriesInfo
  )
);

export const get_responses_info = cache(
  promisify<GetResponsesInfoRequest, GetResponsesInfoResponse>(
    global.grpc_client.getResponsesInfo
  )
);

export const get_story_responses_info = cache(
  promisify<GetStoryResponsesInfoRequest, GetStoryResponsesInfoResponse>(
    global.grpc_client.getStoryResponsesInfo
  )
);

export const get_followed_tag_count = cache(
  promisify<GetFollowedTagCountRequest, GetFollowedTagCountResponse>(
    global.grpc_client.getFollowedTagCount
  )
);

export const get_user_relations_info = cache(
  promisify<GetUserRelationsInfoRequest, GetUserRelationsInfoResponse>(
    global.grpc_client.getUserRelationsInfo
  )
);

export const get_user_block_count = cache(
  promisify<GetUserBlockCountRequest, GetUserBlockCountResponse>(
    global.grpc_client.getUserBlockCount
  )
);

export const get_user_mute_count = cache(
  promisify<GetUserMuteCountRequest, GetUserMuteCountResponse>(
    global.grpc_client.getUserMuteCount
  )
);

export const get_tag = cache(
  promisify<GetTagRequest, GetTagResponse>(global.grpc_client.getTag)
);

export const get_profile = cache(
  promisify<GetProfileRequest, GetProfileResponse>(
    global.grpc_client.getProfile
  )
);

export const get_token = cache(
  promisify<GetTokenRequest, GetTokenResponse>(global.grpc_client.getToken)
);

export const verify_email = cache(
  promisify<VerifyEmailRequest, VerifyEmailResponse>(
    global.grpc_client.verifyEmail
  )
);

export const get_story = cache(
  promisify<GetStoryRequest, GetStoryResponse>(global.grpc_client.getStory)
);
