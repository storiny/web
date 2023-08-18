import "server-only";

import { credentials, ServiceError } from "@grpc/grpc-js";
import { ApiServiceClient } from "@storiny/proto/gen/ts/api_service/v1/service";
import { GetConnectionSettingsResponse } from "@storiny/proto/gen/ts/connection_settings_def/v1/def";
import { GetCredentialSettingsResponse } from "@storiny/proto/gen/ts/credential_settings_def/v1/def";
import { GetLoginActivityResponse } from "@storiny/proto/gen/ts/login_activity_def/v1/def";
import { GetNotificationSettingsResponse } from "@storiny/proto/gen/ts/notification_settings_def/v1/def";
import { GetPrivacySettingsResponse } from "@storiny/proto/gen/ts/privacy_settings_def/v1/def";
import { GetProfileResponse } from "@storiny/proto/gen/ts/profile_def/v1/def";
import { GetResponsesInfoResponse } from "@storiny/proto/gen/ts/response_def/v1/def";
import {
  GetDraftsInfoResponse,
  GetStoriesInfoResponse
} from "@storiny/proto/gen/ts/story_def/v1/def";
import { GetTagResponse } from "@storiny/proto/gen/ts/tag_def/v1/def";
import {
  GetTokenResponse,
  VerifyEmailResponse
} from "@storiny/proto/gen/ts/token_def/v1/def";
import { GetUserIdResponse } from "@storiny/proto/gen/ts/user_def/v1/def";

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
  <R extends any>(callback: (...args: any) => any) =>
  (payload: Parameters<typeof callback>[0]): Promise<R> =>
    new Promise((resolve, reject) => {
      callback.bind(global.grpcClient)(
        payload,
        (err: ServiceError | null, response: R) => {
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
  GetLoginActivityResponse,
  GetNotificationSettingsResponse,
  GetPrivacySettingsResponse,
  GetProfileResponse,
  GetResponsesInfoResponse,
  GetStoriesInfoResponse,
  GetTagResponse,
  GetTokenResponse,
  GetUserIdResponse,
  VerifyEmailResponse
};

export const getUserId = promisify<GetUserIdResponse>(
  global.grpcClient.getUserId
);

export const getCredentialSettings = promisify<GetCredentialSettingsResponse>(
  global.grpcClient.getCredentialSettings
);

export const getPrivacySettings = promisify<GetPrivacySettingsResponse>(
  global.grpcClient.getPrivacySettings
);

export const getNotificationSettings =
  promisify<GetNotificationSettingsResponse>(
    global.grpcClient.getNotificationSettings
  );

export const getConnectionSettings = promisify<GetConnectionSettingsResponse>(
  global.grpcClient.getConnectionSettings
);

export const getLoginActivity = promisify<GetLoginActivityResponse>(
  global.grpcClient.getLoginActivity
);

export const getDraftsInfo = promisify<GetDraftsInfoResponse>(
  global.grpcClient.getDraftsInfo
);

export const getStoriesInfo = promisify<GetStoriesInfoResponse>(
  global.grpcClient.getStoriesInfo
);

export const getResponsesInfo = promisify<GetResponsesInfoResponse>(
  global.grpcClient.getResponsesInfo
);

export const getTag = promisify<GetTagResponse>(global.grpcClient.getTag);

export const getProfile = promisify<GetProfileResponse>(
  global.grpcClient.getProfile
);

export const getToken = promisify<GetTokenResponse>(global.grpcClient.getToken);

export const verifyEmail = promisify<VerifyEmailResponse>(
  global.grpcClient.verifyEmail
);
