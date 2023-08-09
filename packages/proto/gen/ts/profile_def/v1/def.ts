/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Connection } from "../../connection_def/v1/def";
import { Status } from "../../user_def/v1/def";

export const protobufPackage = "profile_def.v1";

export interface GetProfileRequest {
  username: string;
  current_user_id?: string | undefined;
}

export interface GetProfileResponse {
  /** Base props */
  id: string;
  name: string;
  username: string;
  status?: Status | undefined;
  bio?: string | undefined;
  avatar_id?: string | undefined;
  avatar_hex?: string | undefined;
  banner_id?: string | undefined;
  banner_hex?: string | undefined;
  location: string;
  created_at: string;
  public_flags: number;
  story_count: number;
  follower_count: number;
  /** Following and friend lists can be private */
  following_count?: number | undefined;
  friend_count?: number | undefined;
  is_private: boolean;
  connections: Connection[];
  /** User specific props */
  is_following?: boolean | undefined;
  is_follower?: boolean | undefined;
  is_friend?: boolean | undefined;
  is_subscribed?: boolean | undefined;
  is_friend_request_sent?: boolean | undefined;
  is_blocked_by_user?: boolean | undefined;
  is_blocking?: boolean | undefined;
  is_muted?: boolean | undefined;
  is_self?: boolean | undefined;
}

function createBaseGetProfileRequest(): GetProfileRequest {
  return { username: "", current_user_id: undefined };
}

export const GetProfileRequest = {
  encode(message: GetProfileRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.username !== "") {
      writer.uint32(10).string(message.username);
    }
    if (message.current_user_id !== undefined) {
      writer.uint32(18).string(message.current_user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetProfileRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetProfileRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.username = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.current_user_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetProfileRequest {
    return {
      username: isSet(object.username) ? String(object.username) : "",
      current_user_id: isSet(object.current_user_id) ? String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetProfileRequest): unknown {
    const obj: any = {};
    if (message.username !== "") {
      obj.username = message.username;
    }
    if (message.current_user_id !== undefined) {
      obj.current_user_id = message.current_user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetProfileRequest>, I>>(base?: I): GetProfileRequest {
    return GetProfileRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetProfileRequest>, I>>(object: I): GetProfileRequest {
    const message = createBaseGetProfileRequest();
    message.username = object.username ?? "";
    message.current_user_id = object.current_user_id ?? undefined;
    return message;
  },
};

function createBaseGetProfileResponse(): GetProfileResponse {
  return {
    id: "",
    name: "",
    username: "",
    status: undefined,
    bio: undefined,
    avatar_id: undefined,
    avatar_hex: undefined,
    banner_id: undefined,
    banner_hex: undefined,
    location: "",
    created_at: "",
    public_flags: 0,
    story_count: 0,
    follower_count: 0,
    following_count: undefined,
    friend_count: undefined,
    is_private: false,
    connections: [],
    is_following: undefined,
    is_follower: undefined,
    is_friend: undefined,
    is_subscribed: undefined,
    is_friend_request_sent: undefined,
    is_blocked_by_user: undefined,
    is_blocking: undefined,
    is_muted: undefined,
    is_self: undefined,
  };
}

export const GetProfileResponse = {
  encode(message: GetProfileResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.username !== "") {
      writer.uint32(26).string(message.username);
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(34).fork()).ldelim();
    }
    if (message.bio !== undefined) {
      writer.uint32(42).string(message.bio);
    }
    if (message.avatar_id !== undefined) {
      writer.uint32(50).string(message.avatar_id);
    }
    if (message.avatar_hex !== undefined) {
      writer.uint32(58).string(message.avatar_hex);
    }
    if (message.banner_id !== undefined) {
      writer.uint32(66).string(message.banner_id);
    }
    if (message.banner_hex !== undefined) {
      writer.uint32(74).string(message.banner_hex);
    }
    if (message.location !== "") {
      writer.uint32(82).string(message.location);
    }
    if (message.created_at !== "") {
      writer.uint32(90).string(message.created_at);
    }
    if (message.public_flags !== 0) {
      writer.uint32(96).int64(message.public_flags);
    }
    if (message.story_count !== 0) {
      writer.uint32(104).int32(message.story_count);
    }
    if (message.follower_count !== 0) {
      writer.uint32(112).int32(message.follower_count);
    }
    if (message.following_count !== undefined) {
      writer.uint32(120).int32(message.following_count);
    }
    if (message.friend_count !== undefined) {
      writer.uint32(128).int32(message.friend_count);
    }
    if (message.is_private === true) {
      writer.uint32(136).bool(message.is_private);
    }
    for (const v of message.connections) {
      Connection.encode(v!, writer.uint32(146).fork()).ldelim();
    }
    if (message.is_following !== undefined) {
      writer.uint32(152).bool(message.is_following);
    }
    if (message.is_follower !== undefined) {
      writer.uint32(160).bool(message.is_follower);
    }
    if (message.is_friend !== undefined) {
      writer.uint32(168).bool(message.is_friend);
    }
    if (message.is_subscribed !== undefined) {
      writer.uint32(176).bool(message.is_subscribed);
    }
    if (message.is_friend_request_sent !== undefined) {
      writer.uint32(184).bool(message.is_friend_request_sent);
    }
    if (message.is_blocked_by_user !== undefined) {
      writer.uint32(192).bool(message.is_blocked_by_user);
    }
    if (message.is_blocking !== undefined) {
      writer.uint32(200).bool(message.is_blocking);
    }
    if (message.is_muted !== undefined) {
      writer.uint32(208).bool(message.is_muted);
    }
    if (message.is_self !== undefined) {
      writer.uint32(216).bool(message.is_self);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetProfileResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetProfileResponse();
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

          message.status = Status.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.bio = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.avatar_id = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.avatar_hex = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.banner_id = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.banner_hex = reader.string();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.location = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.public_flags = longToNumber(reader.int64() as Long);
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.story_count = reader.int32();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.follower_count = reader.int32();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.following_count = reader.int32();
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.friend_count = reader.int32();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.is_private = reader.bool();
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.connections.push(Connection.decode(reader, reader.uint32()));
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.is_following = reader.bool();
          continue;
        case 20:
          if (tag !== 160) {
            break;
          }

          message.is_follower = reader.bool();
          continue;
        case 21:
          if (tag !== 168) {
            break;
          }

          message.is_friend = reader.bool();
          continue;
        case 22:
          if (tag !== 176) {
            break;
          }

          message.is_subscribed = reader.bool();
          continue;
        case 23:
          if (tag !== 184) {
            break;
          }

          message.is_friend_request_sent = reader.bool();
          continue;
        case 24:
          if (tag !== 192) {
            break;
          }

          message.is_blocked_by_user = reader.bool();
          continue;
        case 25:
          if (tag !== 200) {
            break;
          }

          message.is_blocking = reader.bool();
          continue;
        case 26:
          if (tag !== 208) {
            break;
          }

          message.is_muted = reader.bool();
          continue;
        case 27:
          if (tag !== 216) {
            break;
          }

          message.is_self = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetProfileResponse {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      name: isSet(object.name) ? String(object.name) : "",
      username: isSet(object.username) ? String(object.username) : "",
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
      bio: isSet(object.bio) ? String(object.bio) : undefined,
      avatar_id: isSet(object.avatar_id) ? String(object.avatar_id) : undefined,
      avatar_hex: isSet(object.avatar_hex) ? String(object.avatar_hex) : undefined,
      banner_id: isSet(object.banner_id) ? String(object.banner_id) : undefined,
      banner_hex: isSet(object.banner_hex) ? String(object.banner_hex) : undefined,
      location: isSet(object.location) ? String(object.location) : "",
      created_at: isSet(object.created_at) ? String(object.created_at) : "",
      public_flags: isSet(object.public_flags) ? Number(object.public_flags) : 0,
      story_count: isSet(object.story_count) ? Number(object.story_count) : 0,
      follower_count: isSet(object.follower_count) ? Number(object.follower_count) : 0,
      following_count: isSet(object.following_count) ? Number(object.following_count) : undefined,
      friend_count: isSet(object.friend_count) ? Number(object.friend_count) : undefined,
      is_private: isSet(object.is_private) ? Boolean(object.is_private) : false,
      connections: Array.isArray(object?.connections) ? object.connections.map((e: any) => Connection.fromJSON(e)) : [],
      is_following: isSet(object.is_following) ? Boolean(object.is_following) : undefined,
      is_follower: isSet(object.is_follower) ? Boolean(object.is_follower) : undefined,
      is_friend: isSet(object.is_friend) ? Boolean(object.is_friend) : undefined,
      is_subscribed: isSet(object.is_subscribed) ? Boolean(object.is_subscribed) : undefined,
      is_friend_request_sent: isSet(object.is_friend_request_sent) ? Boolean(object.is_friend_request_sent) : undefined,
      is_blocked_by_user: isSet(object.is_blocked_by_user) ? Boolean(object.is_blocked_by_user) : undefined,
      is_blocking: isSet(object.is_blocking) ? Boolean(object.is_blocking) : undefined,
      is_muted: isSet(object.is_muted) ? Boolean(object.is_muted) : undefined,
      is_self: isSet(object.is_self) ? Boolean(object.is_self) : undefined,
    };
  },

  toJSON(message: GetProfileResponse): unknown {
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
    if (message.status !== undefined) {
      obj.status = Status.toJSON(message.status);
    }
    if (message.bio !== undefined) {
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
    if (message.location !== "") {
      obj.location = message.location;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.public_flags !== 0) {
      obj.public_flags = Math.round(message.public_flags);
    }
    if (message.story_count !== 0) {
      obj.story_count = Math.round(message.story_count);
    }
    if (message.follower_count !== 0) {
      obj.follower_count = Math.round(message.follower_count);
    }
    if (message.following_count !== undefined) {
      obj.following_count = Math.round(message.following_count);
    }
    if (message.friend_count !== undefined) {
      obj.friend_count = Math.round(message.friend_count);
    }
    if (message.is_private === true) {
      obj.is_private = message.is_private;
    }
    if (message.connections?.length) {
      obj.connections = message.connections.map((e) => Connection.toJSON(e));
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
    if (message.is_subscribed !== undefined) {
      obj.is_subscribed = message.is_subscribed;
    }
    if (message.is_friend_request_sent !== undefined) {
      obj.is_friend_request_sent = message.is_friend_request_sent;
    }
    if (message.is_blocked_by_user !== undefined) {
      obj.is_blocked_by_user = message.is_blocked_by_user;
    }
    if (message.is_blocking !== undefined) {
      obj.is_blocking = message.is_blocking;
    }
    if (message.is_muted !== undefined) {
      obj.is_muted = message.is_muted;
    }
    if (message.is_self !== undefined) {
      obj.is_self = message.is_self;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetProfileResponse>, I>>(base?: I): GetProfileResponse {
    return GetProfileResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetProfileResponse>, I>>(object: I): GetProfileResponse {
    const message = createBaseGetProfileResponse();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.username = object.username ?? "";
    message.status = (object.status !== undefined && object.status !== null)
      ? Status.fromPartial(object.status)
      : undefined;
    message.bio = object.bio ?? undefined;
    message.avatar_id = object.avatar_id ?? undefined;
    message.avatar_hex = object.avatar_hex ?? undefined;
    message.banner_id = object.banner_id ?? undefined;
    message.banner_hex = object.banner_hex ?? undefined;
    message.location = object.location ?? "";
    message.created_at = object.created_at ?? "";
    message.public_flags = object.public_flags ?? 0;
    message.story_count = object.story_count ?? 0;
    message.follower_count = object.follower_count ?? 0;
    message.following_count = object.following_count ?? undefined;
    message.friend_count = object.friend_count ?? undefined;
    message.is_private = object.is_private ?? false;
    message.connections = object.connections?.map((e) => Connection.fromPartial(e)) || [];
    message.is_following = object.is_following ?? undefined;
    message.is_follower = object.is_follower ?? undefined;
    message.is_friend = object.is_friend ?? undefined;
    message.is_subscribed = object.is_subscribed ?? undefined;
    message.is_friend_request_sent = object.is_friend_request_sent ?? undefined;
    message.is_blocked_by_user = object.is_blocked_by_user ?? undefined;
    message.is_blocking = object.is_blocking ?? undefined;
    message.is_muted = object.is_muted ?? undefined;
    message.is_self = object.is_self ?? undefined;
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
