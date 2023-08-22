/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "user_def.v1";

export const StatusVisibility = { UNSPECIFIED: 0, GLOBAL: 1, FOLLOWERS: 2, FRIENDS: 3, UNRECOGNIZED: -1 } as const;

export type StatusVisibility = typeof StatusVisibility[keyof typeof StatusVisibility];

export function statusVisibilityFromJSON(object: any): StatusVisibility {
  switch (object) {
    case 0:
    case "STATUS_VISIBILITY_UNSPECIFIED":
      return StatusVisibility.UNSPECIFIED;
    case 1:
    case "STATUS_VISIBILITY_GLOBAL":
      return StatusVisibility.GLOBAL;
    case 2:
    case "STATUS_VISIBILITY_FOLLOWERS":
      return StatusVisibility.FOLLOWERS;
    case 3:
    case "STATUS_VISIBILITY_FRIENDS":
      return StatusVisibility.FRIENDS;
    case -1:
    case "UNRECOGNIZED":
    default:
      return StatusVisibility.UNRECOGNIZED;
  }
}

export function statusVisibilityToJSON(object: StatusVisibility): string {
  switch (object) {
    case StatusVisibility.UNSPECIFIED:
      return "STATUS_VISIBILITY_UNSPECIFIED";
    case StatusVisibility.GLOBAL:
      return "STATUS_VISIBILITY_GLOBAL";
    case StatusVisibility.FOLLOWERS:
      return "STATUS_VISIBILITY_FOLLOWERS";
    case StatusVisibility.FRIENDS:
      return "STATUS_VISIBILITY_FRIENDS";
    case StatusVisibility.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Status {
  emoji?: string | undefined;
  text?: string | undefined;
  expires_at?: string | undefined;
  visibility: StatusVisibility;
}

export interface GetUserIdRequest {
  /** Token from the session cookie */
  token: string;
}

export interface GetUserIdResponse {
  id: string;
}

export interface GetUserRelationsInfoRequest {
  id: string;
}

export interface GetUserRelationsInfoResponse {
  follower_count: number;
  following_count: number;
  friend_count: number;
  pending_friend_request_count: number;
}

export interface GetUserBlockCountRequest {
  id: string;
}

export interface GetUserBlockCountResponse {
  block_count: number;
}

export interface GetUserMuteCountRequest {
  id: string;
}

export interface GetUserMuteCountResponse {
  mute_count: number;
}

function createBaseStatus(): Status {
  return { emoji: undefined, text: undefined, expires_at: undefined, visibility: 0 };
}

export const Status = {
  encode(message: Status, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.emoji !== undefined) {
      writer.uint32(10).string(message.emoji);
    }
    if (message.text !== undefined) {
      writer.uint32(18).string(message.text);
    }
    if (message.expires_at !== undefined) {
      writer.uint32(26).string(message.expires_at);
    }
    if (message.visibility !== 0) {
      writer.uint32(32).int32(message.visibility);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Status {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.emoji = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.text = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.expires_at = reader.string();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.visibility = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Status {
    return {
      emoji: isSet(object.emoji) ? String(object.emoji) : undefined,
      text: isSet(object.text) ? String(object.text) : undefined,
      expires_at: isSet(object.expires_at) ? String(object.expires_at) : undefined,
      visibility: isSet(object.visibility) ? statusVisibilityFromJSON(object.visibility) : 0,
    };
  },

  toJSON(message: Status): unknown {
    const obj: any = {};
    if (message.emoji !== undefined) {
      obj.emoji = message.emoji;
    }
    if (message.text !== undefined) {
      obj.text = message.text;
    }
    if (message.expires_at !== undefined) {
      obj.expires_at = message.expires_at;
    }
    if (message.visibility !== 0) {
      obj.visibility = statusVisibilityToJSON(message.visibility);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Status>, I>>(base?: I): Status {
    return Status.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Status>, I>>(object: I): Status {
    const message = createBaseStatus();
    message.emoji = object.emoji ?? undefined;
    message.text = object.text ?? undefined;
    message.expires_at = object.expires_at ?? undefined;
    message.visibility = object.visibility ?? 0;
    return message;
  },
};

function createBaseGetUserIdRequest(): GetUserIdRequest {
  return { token: "" };
}

export const GetUserIdRequest = {
  encode(message: GetUserIdRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.token !== "") {
      writer.uint32(10).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserIdRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserIdRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.token = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserIdRequest {
    return { token: isSet(object.token) ? String(object.token) : "" };
  },

  toJSON(message: GetUserIdRequest): unknown {
    const obj: any = {};
    if (message.token !== "") {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserIdRequest>, I>>(base?: I): GetUserIdRequest {
    return GetUserIdRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserIdRequest>, I>>(object: I): GetUserIdRequest {
    const message = createBaseGetUserIdRequest();
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseGetUserIdResponse(): GetUserIdResponse {
  return { id: "" };
}

export const GetUserIdResponse = {
  encode(message: GetUserIdResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserIdResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserIdResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserIdResponse {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetUserIdResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserIdResponse>, I>>(base?: I): GetUserIdResponse {
    return GetUserIdResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserIdResponse>, I>>(object: I): GetUserIdResponse {
    const message = createBaseGetUserIdResponse();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetUserRelationsInfoRequest(): GetUserRelationsInfoRequest {
  return { id: "" };
}

export const GetUserRelationsInfoRequest = {
  encode(message: GetUserRelationsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserRelationsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserRelationsInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserRelationsInfoRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetUserRelationsInfoRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserRelationsInfoRequest>, I>>(base?: I): GetUserRelationsInfoRequest {
    return GetUserRelationsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserRelationsInfoRequest>, I>>(object: I): GetUserRelationsInfoRequest {
    const message = createBaseGetUserRelationsInfoRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetUserRelationsInfoResponse(): GetUserRelationsInfoResponse {
  return { follower_count: 0, following_count: 0, friend_count: 0, pending_friend_request_count: 0 };
}

export const GetUserRelationsInfoResponse = {
  encode(message: GetUserRelationsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.follower_count !== 0) {
      writer.uint32(8).uint32(message.follower_count);
    }
    if (message.following_count !== 0) {
      writer.uint32(16).uint32(message.following_count);
    }
    if (message.friend_count !== 0) {
      writer.uint32(24).uint32(message.friend_count);
    }
    if (message.pending_friend_request_count !== 0) {
      writer.uint32(32).uint32(message.pending_friend_request_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserRelationsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserRelationsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.follower_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.following_count = reader.uint32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.friend_count = reader.uint32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.pending_friend_request_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserRelationsInfoResponse {
    return {
      follower_count: isSet(object.follower_count) ? Number(object.follower_count) : 0,
      following_count: isSet(object.following_count) ? Number(object.following_count) : 0,
      friend_count: isSet(object.friend_count) ? Number(object.friend_count) : 0,
      pending_friend_request_count: isSet(object.pending_friend_request_count)
        ? Number(object.pending_friend_request_count)
        : 0,
    };
  },

  toJSON(message: GetUserRelationsInfoResponse): unknown {
    const obj: any = {};
    if (message.follower_count !== 0) {
      obj.follower_count = Math.round(message.follower_count);
    }
    if (message.following_count !== 0) {
      obj.following_count = Math.round(message.following_count);
    }
    if (message.friend_count !== 0) {
      obj.friend_count = Math.round(message.friend_count);
    }
    if (message.pending_friend_request_count !== 0) {
      obj.pending_friend_request_count = Math.round(message.pending_friend_request_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserRelationsInfoResponse>, I>>(base?: I): GetUserRelationsInfoResponse {
    return GetUserRelationsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserRelationsInfoResponse>, I>>(object: I): GetUserRelationsInfoResponse {
    const message = createBaseGetUserRelationsInfoResponse();
    message.follower_count = object.follower_count ?? 0;
    message.following_count = object.following_count ?? 0;
    message.friend_count = object.friend_count ?? 0;
    message.pending_friend_request_count = object.pending_friend_request_count ?? 0;
    return message;
  },
};

function createBaseGetUserBlockCountRequest(): GetUserBlockCountRequest {
  return { id: "" };
}

export const GetUserBlockCountRequest = {
  encode(message: GetUserBlockCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserBlockCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserBlockCountRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserBlockCountRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetUserBlockCountRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserBlockCountRequest>, I>>(base?: I): GetUserBlockCountRequest {
    return GetUserBlockCountRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserBlockCountRequest>, I>>(object: I): GetUserBlockCountRequest {
    const message = createBaseGetUserBlockCountRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetUserBlockCountResponse(): GetUserBlockCountResponse {
  return { block_count: 0 };
}

export const GetUserBlockCountResponse = {
  encode(message: GetUserBlockCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.block_count !== 0) {
      writer.uint32(8).uint32(message.block_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserBlockCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserBlockCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.block_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserBlockCountResponse {
    return { block_count: isSet(object.block_count) ? Number(object.block_count) : 0 };
  },

  toJSON(message: GetUserBlockCountResponse): unknown {
    const obj: any = {};
    if (message.block_count !== 0) {
      obj.block_count = Math.round(message.block_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserBlockCountResponse>, I>>(base?: I): GetUserBlockCountResponse {
    return GetUserBlockCountResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserBlockCountResponse>, I>>(object: I): GetUserBlockCountResponse {
    const message = createBaseGetUserBlockCountResponse();
    message.block_count = object.block_count ?? 0;
    return message;
  },
};

function createBaseGetUserMuteCountRequest(): GetUserMuteCountRequest {
  return { id: "" };
}

export const GetUserMuteCountRequest = {
  encode(message: GetUserMuteCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserMuteCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserMuteCountRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserMuteCountRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetUserMuteCountRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserMuteCountRequest>, I>>(base?: I): GetUserMuteCountRequest {
    return GetUserMuteCountRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserMuteCountRequest>, I>>(object: I): GetUserMuteCountRequest {
    const message = createBaseGetUserMuteCountRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetUserMuteCountResponse(): GetUserMuteCountResponse {
  return { mute_count: 0 };
}

export const GetUserMuteCountResponse = {
  encode(message: GetUserMuteCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.mute_count !== 0) {
      writer.uint32(8).uint32(message.mute_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserMuteCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserMuteCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.mute_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserMuteCountResponse {
    return { mute_count: isSet(object.mute_count) ? Number(object.mute_count) : 0 };
  },

  toJSON(message: GetUserMuteCountResponse): unknown {
    const obj: any = {};
    if (message.mute_count !== 0) {
      obj.mute_count = Math.round(message.mute_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserMuteCountResponse>, I>>(base?: I): GetUserMuteCountResponse {
    return GetUserMuteCountResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserMuteCountResponse>, I>>(object: I): GetUserMuteCountResponse {
    const message = createBaseGetUserMuteCountResponse();
    message.mute_count = object.mute_count ?? 0;
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
