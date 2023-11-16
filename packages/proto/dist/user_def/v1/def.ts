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

export const StatusDuration = {
  UNSPECIFIED: 0,
  NEVER: 1,
  MIN_30: 2,
  MIN_60: 3,
  HR_4: 4,
  DAY_1: 5,
  UNRECOGNIZED: -1,
} as const;

export type StatusDuration = typeof StatusDuration[keyof typeof StatusDuration];

export function statusDurationFromJSON(object: any): StatusDuration {
  switch (object) {
    case 0:
    case "STATUS_DURATION_UNSPECIFIED":
      return StatusDuration.UNSPECIFIED;
    case 1:
    case "STATUS_DURATION_NEVER":
      return StatusDuration.NEVER;
    case 2:
    case "STATUS_DURATION_MIN_30":
      return StatusDuration.MIN_30;
    case 3:
    case "STATUS_DURATION_MIN_60":
      return StatusDuration.MIN_60;
    case 4:
    case "STATUS_DURATION_HR_4":
      return StatusDuration.HR_4;
    case 5:
    case "STATUS_DURATION_DAY_1":
      return StatusDuration.DAY_1;
    case -1:
    case "UNRECOGNIZED":
    default:
      return StatusDuration.UNRECOGNIZED;
  }
}

export function statusDurationToJSON(object: StatusDuration): string {
  switch (object) {
    case StatusDuration.UNSPECIFIED:
      return "STATUS_DURATION_UNSPECIFIED";
    case StatusDuration.NEVER:
      return "STATUS_DURATION_NEVER";
    case StatusDuration.MIN_30:
      return "STATUS_DURATION_MIN_30";
    case StatusDuration.MIN_60:
      return "STATUS_DURATION_MIN_60";
    case StatusDuration.HR_4:
      return "STATUS_DURATION_HR_4";
    case StatusDuration.DAY_1:
      return "STATUS_DURATION_DAY_1";
    case StatusDuration.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Status {
  emoji?: string | undefined;
  text?: string | undefined;
  expires_at?: string | undefined;
  duration: StatusDuration;
  visibility: StatusVisibility;
}

export interface BareUser {
  id: string;
  name: string;
  username: string;
  avatar_id?: string | undefined;
  avatar_hex?: string | undefined;
  public_flags: number;
}

export interface ExtendedUser {
  id: string;
  name: string;
  username: string;
  rendered_bio: string;
  avatar_id?: string | undefined;
  avatar_hex?: string | undefined;
  public_flags: number;
  is_private: boolean;
  location: string;
  created_at: string;
  follower_count: number;
  /** User specific props */
  is_self: boolean;
  is_following: boolean;
  is_follower: boolean;
  is_friend: boolean;
  is_blocked_by_user: boolean;
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
  return { emoji: undefined, text: undefined, expires_at: undefined, duration: 0, visibility: 0 };
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
    if (message.duration !== 0) {
      writer.uint32(32).int32(message.duration);
    }
    if (message.visibility !== 0) {
      writer.uint32(40).int32(message.visibility);
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

          message.duration = reader.int32() as any;
          continue;
        case 5:
          if (tag !== 40) {
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
      emoji: isSet(object.emoji) ? globalThis.String(object.emoji) : undefined,
      text: isSet(object.text) ? globalThis.String(object.text) : undefined,
      expires_at: isSet(object.expires_at) ? globalThis.String(object.expires_at) : undefined,
      duration: isSet(object.duration) ? statusDurationFromJSON(object.duration) : 0,
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
    if (message.duration !== 0) {
      obj.duration = statusDurationToJSON(message.duration);
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
    message.duration = object.duration ?? 0;
    message.visibility = object.visibility ?? 0;
    return message;
  },
};

function createBaseBareUser(): BareUser {
  return { id: "", name: "", username: "", avatar_id: undefined, avatar_hex: undefined, public_flags: 0 };
}

export const BareUser = {
  encode(message: BareUser, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.username !== "") {
      writer.uint32(26).string(message.username);
    }
    if (message.avatar_id !== undefined) {
      writer.uint32(34).string(message.avatar_id);
    }
    if (message.avatar_hex !== undefined) {
      writer.uint32(42).string(message.avatar_hex);
    }
    if (message.public_flags !== 0) {
      writer.uint32(48).uint32(message.public_flags);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BareUser {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBareUser();
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

          message.avatar_id = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.avatar_hex = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.public_flags = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BareUser {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      username: isSet(object.username) ? globalThis.String(object.username) : "",
      avatar_id: isSet(object.avatar_id) ? globalThis.String(object.avatar_id) : undefined,
      avatar_hex: isSet(object.avatar_hex) ? globalThis.String(object.avatar_hex) : undefined,
      public_flags: isSet(object.public_flags) ? globalThis.Number(object.public_flags) : 0,
    };
  },

  toJSON(message: BareUser): unknown {
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
    if (message.avatar_id !== undefined) {
      obj.avatar_id = message.avatar_id;
    }
    if (message.avatar_hex !== undefined) {
      obj.avatar_hex = message.avatar_hex;
    }
    if (message.public_flags !== 0) {
      obj.public_flags = Math.round(message.public_flags);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BareUser>, I>>(base?: I): BareUser {
    return BareUser.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BareUser>, I>>(object: I): BareUser {
    const message = createBaseBareUser();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.username = object.username ?? "";
    message.avatar_id = object.avatar_id ?? undefined;
    message.avatar_hex = object.avatar_hex ?? undefined;
    message.public_flags = object.public_flags ?? 0;
    return message;
  },
};

function createBaseExtendedUser(): ExtendedUser {
  return {
    id: "",
    name: "",
    username: "",
    rendered_bio: "",
    avatar_id: undefined,
    avatar_hex: undefined,
    public_flags: 0,
    is_private: false,
    location: "",
    created_at: "",
    follower_count: 0,
    is_self: false,
    is_following: false,
    is_follower: false,
    is_friend: false,
    is_blocked_by_user: false,
  };
}

export const ExtendedUser = {
  encode(message: ExtendedUser, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.username !== "") {
      writer.uint32(26).string(message.username);
    }
    if (message.rendered_bio !== "") {
      writer.uint32(34).string(message.rendered_bio);
    }
    if (message.avatar_id !== undefined) {
      writer.uint32(42).string(message.avatar_id);
    }
    if (message.avatar_hex !== undefined) {
      writer.uint32(50).string(message.avatar_hex);
    }
    if (message.public_flags !== 0) {
      writer.uint32(56).uint32(message.public_flags);
    }
    if (message.is_private === true) {
      writer.uint32(64).bool(message.is_private);
    }
    if (message.location !== "") {
      writer.uint32(74).string(message.location);
    }
    if (message.created_at !== "") {
      writer.uint32(82).string(message.created_at);
    }
    if (message.follower_count !== 0) {
      writer.uint32(88).uint32(message.follower_count);
    }
    if (message.is_self === true) {
      writer.uint32(96).bool(message.is_self);
    }
    if (message.is_following === true) {
      writer.uint32(104).bool(message.is_following);
    }
    if (message.is_follower === true) {
      writer.uint32(112).bool(message.is_follower);
    }
    if (message.is_friend === true) {
      writer.uint32(120).bool(message.is_friend);
    }
    if (message.is_blocked_by_user === true) {
      writer.uint32(128).bool(message.is_blocked_by_user);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ExtendedUser {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExtendedUser();
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

          message.rendered_bio = reader.string();
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
          if (tag !== 56) {
            break;
          }

          message.public_flags = reader.uint32();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.is_private = reader.bool();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.location = reader.string();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.follower_count = reader.uint32();
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.is_self = reader.bool();
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.is_following = reader.bool();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.is_follower = reader.bool();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.is_friend = reader.bool();
          continue;
        case 16:
          if (tag !== 128) {
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

  fromJSON(object: any): ExtendedUser {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      username: isSet(object.username) ? globalThis.String(object.username) : "",
      rendered_bio: isSet(object.rendered_bio) ? globalThis.String(object.rendered_bio) : "",
      avatar_id: isSet(object.avatar_id) ? globalThis.String(object.avatar_id) : undefined,
      avatar_hex: isSet(object.avatar_hex) ? globalThis.String(object.avatar_hex) : undefined,
      public_flags: isSet(object.public_flags) ? globalThis.Number(object.public_flags) : 0,
      is_private: isSet(object.is_private) ? globalThis.Boolean(object.is_private) : false,
      location: isSet(object.location) ? globalThis.String(object.location) : "",
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      follower_count: isSet(object.follower_count) ? globalThis.Number(object.follower_count) : 0,
      is_self: isSet(object.is_self) ? globalThis.Boolean(object.is_self) : false,
      is_following: isSet(object.is_following) ? globalThis.Boolean(object.is_following) : false,
      is_follower: isSet(object.is_follower) ? globalThis.Boolean(object.is_follower) : false,
      is_friend: isSet(object.is_friend) ? globalThis.Boolean(object.is_friend) : false,
      is_blocked_by_user: isSet(object.is_blocked_by_user) ? globalThis.Boolean(object.is_blocked_by_user) : false,
    };
  },

  toJSON(message: ExtendedUser): unknown {
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
    if (message.rendered_bio !== "") {
      obj.rendered_bio = message.rendered_bio;
    }
    if (message.avatar_id !== undefined) {
      obj.avatar_id = message.avatar_id;
    }
    if (message.avatar_hex !== undefined) {
      obj.avatar_hex = message.avatar_hex;
    }
    if (message.public_flags !== 0) {
      obj.public_flags = Math.round(message.public_flags);
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
    if (message.is_self === true) {
      obj.is_self = message.is_self;
    }
    if (message.is_following === true) {
      obj.is_following = message.is_following;
    }
    if (message.is_follower === true) {
      obj.is_follower = message.is_follower;
    }
    if (message.is_friend === true) {
      obj.is_friend = message.is_friend;
    }
    if (message.is_blocked_by_user === true) {
      obj.is_blocked_by_user = message.is_blocked_by_user;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ExtendedUser>, I>>(base?: I): ExtendedUser {
    return ExtendedUser.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ExtendedUser>, I>>(object: I): ExtendedUser {
    const message = createBaseExtendedUser();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.username = object.username ?? "";
    message.rendered_bio = object.rendered_bio ?? "";
    message.avatar_id = object.avatar_id ?? undefined;
    message.avatar_hex = object.avatar_hex ?? undefined;
    message.public_flags = object.public_flags ?? 0;
    message.is_private = object.is_private ?? false;
    message.location = object.location ?? "";
    message.created_at = object.created_at ?? "";
    message.follower_count = object.follower_count ?? 0;
    message.is_self = object.is_self ?? false;
    message.is_following = object.is_following ?? false;
    message.is_follower = object.is_follower ?? false;
    message.is_friend = object.is_friend ?? false;
    message.is_blocked_by_user = object.is_blocked_by_user ?? false;
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
    return { token: isSet(object.token) ? globalThis.String(object.token) : "" };
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
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
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
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
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
      follower_count: isSet(object.follower_count) ? globalThis.Number(object.follower_count) : 0,
      following_count: isSet(object.following_count) ? globalThis.Number(object.following_count) : 0,
      friend_count: isSet(object.friend_count) ? globalThis.Number(object.friend_count) : 0,
      pending_friend_request_count: isSet(object.pending_friend_request_count)
        ? globalThis.Number(object.pending_friend_request_count)
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
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
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
    return { block_count: isSet(object.block_count) ? globalThis.Number(object.block_count) : 0 };
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
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
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
    return { mute_count: isSet(object.mute_count) ? globalThis.Number(object.mute_count) : 0 };
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
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
