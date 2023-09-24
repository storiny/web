/* eslint-disable */
import Long from "long";
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

export interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar_id?: string | undefined;
  avatar_hex?: string | undefined;
  banner_id?: string | undefined;
  banner_hex?: string | undefined;
  public_flags: number;
  wpm: number;
  is_private: boolean;
  location: string;
  created_at: string;
  follower_count: number;
  /** User specific props */
  is_self?: boolean | undefined;
  is_following?: boolean | undefined;
  is_follower?: boolean | undefined;
  is_friend?: boolean | undefined;
  is_blocked_by_user?: boolean | undefined;
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

function createBaseUser(): User {
  return {
    id: "",
    name: "",
    username: "",
    bio: "",
    avatar_id: undefined,
    avatar_hex: undefined,
    banner_id: undefined,
    banner_hex: undefined,
    public_flags: 0,
    wpm: 0,
    is_private: false,
    location: "",
    created_at: "",
    follower_count: 0,
    is_self: undefined,
    is_following: undefined,
    is_follower: undefined,
    is_friend: undefined,
    is_blocked_by_user: undefined,
  };
}

export const User = {
  encode(message: User, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.username !== "") {
      writer.uint32(26).string(message.username);
    }
    if (message.bio !== "") {
      writer.uint32(34).string(message.bio);
    }
    if (message.avatar_id !== undefined) {
      writer.uint32(42).string(message.avatar_id);
    }
    if (message.avatar_hex !== undefined) {
      writer.uint32(50).string(message.avatar_hex);
    }
    if (message.banner_id !== undefined) {
      writer.uint32(58).string(message.banner_id);
    }
    if (message.banner_hex !== undefined) {
      writer.uint32(66).string(message.banner_hex);
    }
    if (message.public_flags !== 0) {
      writer.uint32(72).uint64(message.public_flags);
    }
    if (message.wpm !== 0) {
      writer.uint32(80).uint32(message.wpm);
    }
    if (message.is_private === true) {
      writer.uint32(88).bool(message.is_private);
    }
    if (message.location !== "") {
      writer.uint32(98).string(message.location);
    }
    if (message.created_at !== "") {
      writer.uint32(106).string(message.created_at);
    }
    if (message.follower_count !== 0) {
      writer.uint32(112).uint32(message.follower_count);
    }
    if (message.is_self !== undefined) {
      writer.uint32(120).bool(message.is_self);
    }
    if (message.is_following !== undefined) {
      writer.uint32(128).bool(message.is_following);
    }
    if (message.is_follower !== undefined) {
      writer.uint32(136).bool(message.is_follower);
    }
    if (message.is_friend !== undefined) {
      writer.uint32(144).bool(message.is_friend);
    }
    if (message.is_blocked_by_user !== undefined) {
      writer.uint32(152).bool(message.is_blocked_by_user);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): User {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUser();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.username = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.bio = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.avatar_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.avatar_hex = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.banner_id = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.banner_hex = reader.string();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.public_flags = longToNumber(reader.uint64() as Long);
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.wpm = reader.uint32();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.is_private = reader.bool();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.location = reader.string();
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.follower_count = reader.uint32();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.is_self = reader.bool();
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.is_following = reader.bool();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.is_follower = reader.bool();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.is_friend = reader.bool();
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.is_blocked_by_user = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): User {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      name: isSet(object.name) ? String(object.name) : "",
      username: isSet(object.username) ? String(object.username) : "",
      bio: isSet(object.bio) ? String(object.bio) : "",
      avatar_id: isSet(object.avatar_id) ? String(object.avatar_id) : undefined,
      avatar_hex: isSet(object.avatar_hex) ? String(object.avatar_hex) : undefined,
      banner_id: isSet(object.banner_id) ? String(object.banner_id) : undefined,
      banner_hex: isSet(object.banner_hex) ? String(object.banner_hex) : undefined,
      public_flags: isSet(object.public_flags) ? Number(object.public_flags) : 0,
      wpm: isSet(object.wpm) ? Number(object.wpm) : 0,
      is_private: isSet(object.is_private) ? Boolean(object.is_private) : false,
      location: isSet(object.location) ? String(object.location) : "",
      created_at: isSet(object.created_at) ? String(object.created_at) : "",
      follower_count: isSet(object.follower_count) ? Number(object.follower_count) : 0,
      is_self: isSet(object.is_self) ? Boolean(object.is_self) : undefined,
      is_following: isSet(object.is_following) ? Boolean(object.is_following) : undefined,
      is_follower: isSet(object.is_follower) ? Boolean(object.is_follower) : undefined,
      is_friend: isSet(object.is_friend) ? Boolean(object.is_friend) : undefined,
      is_blocked_by_user: isSet(object.is_blocked_by_user) ? Boolean(object.is_blocked_by_user) : undefined,
    };
  },

  toJSON(message: User): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.username !== "") {
      obj.username = message.username;
    }
    if (message.bio !== "") {
      obj.bio = message.bio;
    }
    if (message.avatar_id !== undefined) {
      obj.avatar_id = message.avatar_id;
    }
    if (message.avatar_hex !== undefined) {
      obj.avatar_hex = message.avatar_hex;
    }
    if (message.banner_id !== undefined) {
      obj.banner_id = message.banner_id;
    }
    if (message.banner_hex !== undefined) {
      obj.banner_hex = message.banner_hex;
    }
    if (message.public_flags !== 0) {
      obj.public_flags = Math.round(message.public_flags);
    }
    if (message.wpm !== 0) {
      obj.wpm = Math.round(message.wpm);
    }
    if (message.is_private === true) {
      obj.is_private = message.is_private;
    }
    if (message.location !== "") {
      obj.location = message.location;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.follower_count !== 0) {
      obj.follower_count = Math.round(message.follower_count);
    }
    if (message.is_self !== undefined) {
      obj.is_self = message.is_self;
    }
    if (message.is_following !== undefined) {
      obj.is_following = message.is_following;
    }
    if (message.is_follower !== undefined) {
      obj.is_follower = message.is_follower;
    }
    if (message.is_friend !== undefined) {
      obj.is_friend = message.is_friend;
    }
    if (message.is_blocked_by_user !== undefined) {
      obj.is_blocked_by_user = message.is_blocked_by_user;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<User>, I>>(base?: I): User {
    return User.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<User>, I>>(object: I): User {
    const message = createBaseUser();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.username = object.username ?? "";
    message.bio = object.bio ?? "";
    message.avatar_id = object.avatar_id ?? undefined;
    message.avatar_hex = object.avatar_hex ?? undefined;
    message.banner_id = object.banner_id ?? undefined;
    message.banner_hex = object.banner_hex ?? undefined;
    message.public_flags = object.public_flags ?? 0;
    message.wpm = object.wpm ?? 0;
    message.is_private = object.is_private ?? false;
    message.location = object.location ?? "";
    message.created_at = object.created_at ?? "";
    message.follower_count = object.follower_count ?? 0;
    message.is_self = object.is_self ?? undefined;
    message.is_following = object.is_following ?? undefined;
    message.is_follower = object.is_follower ?? undefined;
    message.is_friend = object.is_friend ?? undefined;
    message.is_blocked_by_user = object.is_blocked_by_user ?? undefined;
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

declare const self: any | undefined;
declare const window: any | undefined;
declare const global: any | undefined;
const tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
