/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import {
  GetProfileRequest,
  GetProfileResponse,
} from "../../profile_def/v1/def";
import { GetTagRequest, GetTagResponse } from "../../tag_def/v1/def";
import {
  GetTokenRequest,
  GetTokenResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "../../token_def/v1/def";

export const protobufPackage = "api_service.v1";

/** Service definition */
export type ApiServiceService = typeof ApiServiceService;
export const ApiServiceService = {
  getProfile: {
    path: "/api_service.v1.ApiService/GetProfile",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetProfileRequest) =>
      Buffer.from(GetProfileRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetProfileRequest.decode(value),
    responseSerialize: (value: GetProfileResponse) =>
      Buffer.from(GetProfileResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetProfileResponse.decode(value),
  },
  getTag: {
    path: "/api_service.v1.ApiService/GetTag",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTagRequest) =>
      Buffer.from(GetTagRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTagRequest.decode(value),
    responseSerialize: (value: GetTagResponse) =>
      Buffer.from(GetTagResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTagResponse.decode(value),
  },
  getToken: {
    path: "/api_service.v1.ApiService/GetToken",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetTokenRequest) =>
      Buffer.from(GetTokenRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetTokenRequest.decode(value),
    responseSerialize: (value: GetTokenResponse) =>
      Buffer.from(GetTokenResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetTokenResponse.decode(value),
  },
  verifyEmail: {
    path: "/api_service.v1.ApiService/VerifyEmail",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: VerifyEmailRequest) =>
      Buffer.from(VerifyEmailRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => VerifyEmailRequest.decode(value),
    responseSerialize: (value: VerifyEmailResponse) =>
      Buffer.from(VerifyEmailResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => VerifyEmailResponse.decode(value),
  },
} as const;

export interface ApiServiceServer extends UntypedServiceImplementation {
  getProfile: handleUnaryCall<GetProfileRequest, GetProfileResponse>;
  getTag: handleUnaryCall<GetTagRequest, GetTagResponse>;
  getToken: handleUnaryCall<GetTokenRequest, GetTokenResponse>;
  verifyEmail: handleUnaryCall<VerifyEmailRequest, VerifyEmailResponse>;
}

export interface ApiServiceClient extends Client {
  getProfile(
    request: GetProfileRequest,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void
  ): ClientUnaryCall;
  getProfile(
    request: GetProfileRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void
  ): ClientUnaryCall;
  getProfile(
    request: GetProfileRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetProfileResponse) => void
  ): ClientUnaryCall;
  getTag(
    request: GetTagRequest,
    callback: (error: ServiceError | null, response: GetTagResponse) => void
  ): ClientUnaryCall;
  getTag(
    request: GetTagRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTagResponse) => void
  ): ClientUnaryCall;
  getTag(
    request: GetTagRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTagResponse) => void
  ): ClientUnaryCall;
  getToken(
    request: GetTokenRequest,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void
  ): ClientUnaryCall;
  getToken(
    request: GetTokenRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void
  ): ClientUnaryCall;
  getToken(
    request: GetTokenRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetTokenResponse) => void
  ): ClientUnaryCall;
  verifyEmail(
    request: VerifyEmailRequest,
    callback: (
      error: ServiceError | null,
      response: VerifyEmailResponse
    ) => void
  ): ClientUnaryCall;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata: Metadata,
    callback: (
      error: ServiceError | null,
      response: VerifyEmailResponse
    ) => void
  ): ClientUnaryCall;
  verifyEmail(
    request: VerifyEmailRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (
      error: ServiceError | null,
      response: VerifyEmailResponse
    ) => void
  ): ClientUnaryCall;
}

export const ApiServiceClient = makeGenericClientConstructor(
  ApiServiceService,
  "api_service.v1.ApiService"
) as unknown as {
  new (
    address: string,
    credentials: ChannelCredentials,
    options?: Partial<ClientOptions>
  ): ApiServiceClient;
  service: typeof ApiServiceService;
};
