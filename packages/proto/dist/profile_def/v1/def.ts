/* eslint-disable */
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
  rendered_bio?: string | undefined;
  avatar_id?: string | undefined;
  avatar_hex?: string | undefined;
  banner_id?: string | undefined;
  banner_hex?: string | undefined;
  location: string;
  created_at: string;
  public_flags: number;
  story_count: number;
  follower_count: number;
  /** Following and friend lists can be private (optional=private) */
  following_count?: number | undefined;
  friend_count?: number | undefined;
  is_private: boolean;
  connections: Connection[];
  /** User specific props */
  is_following: boolean;
  is_follower: boolean;
  is_friend: boolean;
  is_subscribed: boolean;
  is_friend_request_sent: boolean;
  is_blocked_by_user: boolean;
  is_blocking: boolean;
  is_muted: boolean;
  is_self: boolean;
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
      username: isSet(object.username) ? globalThis.String(object.username) : "",
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
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
    rendered_bio: undefined,
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
    is_following: false,
    is_follower: false,
    is_friend: false,
    is_subscribed: false,
    is_friend_request_sent: false,
    is_blocked_by_user: false,
    is_blocking: false,
    is_muted: false,
    is_self: false,
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
    if (message.rendered_bio !== undefined) {
      writer.uint32(50).string(message.rendered_bio);
    }
    if (message.avatar_id !== undefined) {
      writer.uint32(58).string(message.avatar_id);
    }
    if (message.avatar_hex !== undefined) {
      writer.uint32(66).string(message.avatar_hex);
    }
    if (message.banner_id !== undefined) {
      writer.uint32(74).string(message.banner_id);
    }
    if (message.banner_hex !== undefined) {
      writer.uint32(82).string(message.banner_hex);
    }
    if (message.location !== "") {
      writer.uint32(90).string(message.location);
    }
    if (message.created_at !== "") {
      writer.uint32(98).string(message.created_at);
    }
    if (message.public_flags !== 0) {
      writer.uint32(104).uint32(message.public_flags);
    }
    if (message.story_count !== 0) {
      writer.uint32(112).uint32(message.story_count);
    }
    if (message.follower_count !== 0) {
      writer.uint32(120).uint32(message.follower_count);
    }
    if (message.following_count !== undefined) {
      writer.uint32(128).uint32(message.following_count);
    }
    if (message.friend_count !== undefined) {
      writer.uint32(136).uint32(message.friend_count);
    }
    if (message.is_private === true) {
      writer.uint32(144).bool(message.is_private);
    }
    for (const v of message.connections) {
      Connection.encode(v!, writer.uint32(154).fork()).ldelim();
    }
    if (message.is_following === true) {
      writer.uint32(160).bool(message.is_following);
    }
    if (message.is_follower === true) {
      writer.uint32(168).bool(message.is_follower);
    }
    if (message.is_friend === true) {
      writer.uint32(176).bool(message.is_friend);
    }
    if (message.is_subscribed === true) {
      writer.uint32(184).bool(message.is_subscribed);
    }
    if (message.is_friend_request_sent === true) {
      writer.uint32(192).bool(message.is_friend_request_sent);
    }
    if (message.is_blocked_by_user === true) {
      writer.uint32(200).bool(message.is_blocked_by_user);
    }
    if (message.is_blocking === true) {
      writer.uint32(208).bool(message.is_blocking);
    }
    if (message.is_muted === true) {
      writer.uint32(216).bool(message.is_muted);
    }
    if (message.is_self === true) {
      writer.uint32(224).bool(message.is_self);
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

          message.rendered_bio = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.avatar_id = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.avatar_hex = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.banner_id = reader.string();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.banner_hex = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.location = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.public_flags = reader.uint32();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.story_count = reader.uint32();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.follower_count = reader.uint32();
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.following_count = reader.uint32();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.friend_count = reader.uint32();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.is_private = reader.bool();
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.connections.push(Connection.decode(reader, reader.uint32()));
          continue;
        case 20:
          if (tag !== 160) {
            break;
          }

          message.is_following = reader.bool();
          continue;
        case 21:
          if (tag !== 168) {
            break;
          }

          message.is_follower = reader.bool();
          continue;
        case 22:
          if (tag !== 176) {
            break;
          }

          message.is_friend = reader.bool();
          continue;
        case 23:
          if (tag !== 184) {
            break;
          }

          message.is_subscribed = reader.bool();
          continue;
        case 24:
          if (tag !== 192) {
            break;
          }

          message.is_friend_request_sent = reader.bool();
          continue;
        case 25:
          if (tag !== 200) {
            break;
          }

          message.is_blocked_by_user = reader.bool();
          continue;
        case 26:
          if (tag !== 208) {
            break;
          }

          message.is_blocking = reader.bool();
          continue;
        case 27:
          if (tag !== 216) {
            break;
          }

          message.is_muted = reader.bool();
          continue;
        case 28:
          if (tag !== 224) {
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
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      username: isSet(object.username) ? globalThis.String(object.username) : "",
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
      bio: isSet(object.bio) ? globalThis.String(object.bio) : undefined,
      rendered_bio: isSet(object.rendered_bio) ? globalThis.String(object.rendered_bio) : undefined,
      avatar_id: isSet(object.avatar_id) ? globalThis.String(object.avatar_id) : undefined,
      avatar_hex: isSet(object.avatar_hex) ? globalThis.String(object.avatar_hex) : undefined,
      banner_id: isSet(object.banner_id) ? globalThis.String(object.banner_id) : undefined,
      banner_hex: isSet(object.banner_hex) ? globalThis.String(object.banner_hex) : undefined,
      location: isSet(object.location) ? globalThis.String(object.location) : "",
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      public_flags: isSet(object.public_flags) ? globalThis.Number(object.public_flags) : 0,
      story_count: isSet(object.story_count) ? globalThis.Number(object.story_count) : 0,
      follower_count: isSet(object.follower_count) ? globalThis.Number(object.follower_count) : 0,
      following_count: isSet(object.following_count) ? globalThis.Number(object.following_count) : undefined,
      friend_count: isSet(object.friend_count) ? globalThis.Number(object.friend_count) : undefined,
      is_private: isSet(object.is_private) ? globalThis.Boolean(object.is_private) : false,
      connections: globalThis.Array.isArray(object?.connections)
        ? object.connections.map((e: any) => Connection.fromJSON(e))
        : [],
      is_following: isSet(object.is_following) ? globalThis.Boolean(object.is_following) : false,
      is_follower: isSet(object.is_follower) ? globalThis.Boolean(object.is_follower) : false,
      is_friend: isSet(object.is_friend) ? globalThis.Boolean(object.is_friend) : false,
      is_subscribed: isSet(object.is_subscribed) ? globalThis.Boolean(object.is_subscribed) : false,
      is_friend_request_sent: isSet(object.is_friend_request_sent)
        ? globalThis.Boolean(object.is_friend_request_sent)
        : false,
      is_blocked_by_user: isSet(object.is_blocked_by_user) ? globalThis.Boolean(object.is_blocked_by_user) : false,
      is_blocking: isSet(object.is_blocking) ? globalThis.Boolean(object.is_blocking) : false,
      is_muted: isSet(object.is_muted) ? globalThis.Boolean(object.is_muted) : false,
      is_self: isSet(object.is_self) ? globalThis.Boolean(object.is_self) : false,
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
    if (message.rendered_bio !== undefined) {
      obj.rendered_bio = message.rendered_bio;
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
    if (message.is_following === true) {
      obj.is_following = message.is_following;
    }
    if (message.is_follower === true) {
      obj.is_follower = message.is_follower;
    }
    if (message.is_friend === true) {
      obj.is_friend = message.is_friend;
    }
    if (message.is_subscribed === true) {
      obj.is_subscribed = message.is_subscribed;
    }
    if (message.is_friend_request_sent === true) {
      obj.is_friend_request_sent = message.is_friend_request_sent;
    }
    if (message.is_blocked_by_user === true) {
      obj.is_blocked_by_user = message.is_blocked_by_user;
    }
    if (message.is_blocking === true) {
      obj.is_blocking = message.is_blocking;
    }
    if (message.is_muted === true) {
      obj.is_muted = message.is_muted;
    }
    if (message.is_self === true) {
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
    message.rendered_bio = object.rendered_bio ?? undefined;
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
    message.is_following = object.is_following ?? false;
    message.is_follower = object.is_follower ?? false;
    message.is_friend = object.is_friend ?? false;
    message.is_subscribed = object.is_subscribed ?? false;
    message.is_friend_request_sent = object.is_friend_request_sent ?? false;
    message.is_blocked_by_user = object.is_blocked_by_user ?? false;
    message.is_blocking = object.is_blocking ?? false;
    message.is_muted = object.is_muted ?? false;
    message.is_self = object.is_self ?? false;
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
