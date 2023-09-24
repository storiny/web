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

declare global {
  // noinspection ES6ConvertVarToLetConst
  var grpcClient: InstanceType<typeof ApiServiceClient>;
}

global.grpcClient = new ApiServiceClient(
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
      callback.bind(global.grpcClient)(
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

export const getUserId = promisify<GetUserIdRequest, GetUserIdResponse>(
  global.grpcClient.getUserId
);

export const getCredentialSettings = promisify<
  GetCredentialSettingsRequest,
  GetCredentialSettingsResponse
>(global.grpcClient.getCredentialSettings);

export const getPrivacySettings = promisify<
  GetPrivacySettingsRequest,
  GetPrivacySettingsResponse
>(global.grpcClient.getPrivacySettings);

export const getNotificationSettings = promisify<
  GetNotificationSettingsRequest,
  GetNotificationSettingsResponse
>(global.grpcClient.getNotificationSettings);

export const getConnectionSettings = promisify<
  GetConnectionSettingsRequest,
  GetConnectionSettingsResponse
>(global.grpcClient.getConnectionSettings);

export const getLoginActivity = promisify<
  GetLoginActivityRequest,
  GetLoginActivityResponse
>(global.grpcClient.getLoginActivity);

export const getDraftsInfo = promisify<
  GetDraftsInfoRequest,
  GetDraftsInfoResponse
>(global.grpcClient.getDraftsInfo);

export const getStoriesInfo = promisify<
  GetStoriesInfoRequest,
  GetStoriesInfoResponse
>(global.grpcClient.getStoriesInfo);

export const getResponsesInfo = promisify<
  GetResponsesInfoRequest,
  GetResponsesInfoResponse
>(global.grpcClient.getResponsesInfo);

export const getStoryResponsesInfo = promisify<
  GetStoryResponsesInfoRequest,
  GetStoryResponsesInfoResponse
>(global.grpcClient.getStoryResponsesInfo);

export const getFollowedTagCount = promisify<
  GetFollowedTagCountRequest,
  GetFollowedTagCountResponse
>(global.grpcClient.getFollowedTagCount);

export const getUserRelationsInfo = promisify<
  GetUserRelationsInfoRequest,
  GetUserRelationsInfoResponse
>(global.grpcClient.getUserRelationsInfo);

export const getUserBlockCount = promisify<
  GetUserBlockCountRequest,
  GetUserBlockCountResponse
>(global.grpcClient.getUserBlockCount);

export const getUserMuteCount = promisify<
  GetUserMuteCountRequest,
  GetUserMuteCountResponse
>(global.grpcClient.getUserMuteCount);

export const getTag = promisify<GetTagRequest, GetTagResponse>(
  global.grpcClient.getTag
);

export const getProfile = promisify<GetProfileRequest, GetProfileResponse>(
  global.grpcClient.getProfile
);

export const getToken = promisify<GetTokenRequest, GetTokenResponse>(
  global.grpcClient.getToken
);

export const verifyEmail = promisify<VerifyEmailRequest, VerifyEmailResponse>(
  global.grpcClient.verifyEmail
);

export const getStory = promisify<GetStoryRequest, GetStoryResponse>(
  global.grpcClient.getStory
);
