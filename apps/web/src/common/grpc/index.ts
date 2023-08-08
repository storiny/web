import "server-only";

import { credentials, ServiceError } from "@grpc/grpc-js";
import { ApiServiceClient } from "@storiny/proto/gen/ts/api_service/v1/service";
import { GetProfileResponse } from "@storiny/proto/gen/ts/profile_def/v1/def";
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
  GetProfileResponse,
  GetTagResponse,
  GetTokenResponse,
  GetUserIdResponse,
  VerifyEmailResponse
};

export const getUserId = promisify<GetUserIdResponse>(
  global.grpcClient.getUserId
);
export const getTag = promisify<GetTagResponse>(global.grpcClient.getTag);
export const getProfile = promisify<GetProfileResponse>(
  global.grpcClient.getProfile
);
export const getToken = promisify<GetTokenResponse>(global.grpcClient.getToken);
export const verifyEmail = promisify<VerifyEmailResponse>(
  global.grpcClient.verifyEmail
);
