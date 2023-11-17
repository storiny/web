/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "tag_def.v1";

export interface Tag {
  id: string;
  name: string;
}

export interface GetTagRequest {
  name: string;
  current_user_id?: string | undefined;
}

export interface GetTagResponse {
  /** Base props */
  id: string;
  name: string;
  story_count: number;
  follower_count: number;
  created_at: string;
  /** User specific props */
  is_following: boolean;
}

export interface GetFollowedTagCountRequest {
  id: string;
}

export interface GetFollowedTagCountResponse {
  followed_tag_count: number;
}

function createBaseTag(): Tag {
  return { id: "", name: "" };
}

export const Tag = {
  encode(message: Tag, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Tag {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTag();
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
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Tag {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
    };
  },

  toJSON(message: Tag): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Tag>, I>>(base?: I): Tag {
    return Tag.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Tag>, I>>(object: I): Tag {
    const message = createBaseTag();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    return message;
  },
};

function createBaseGetTagRequest(): GetTagRequest {
  return { name: "", current_user_id: undefined };
}

export const GetTagRequest = {
  encode(message: GetTagRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.current_user_id !== undefined) {
      writer.uint32(18).string(message.current_user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
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

  fromJSON(object: any): GetTagRequest {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetTagRequest): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.current_user_id !== undefined) {
      obj.current_user_id = message.current_user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagRequest>, I>>(base?: I): GetTagRequest {
    return GetTagRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagRequest>, I>>(object: I): GetTagRequest {
    const message = createBaseGetTagRequest();
    message.name = object.name ?? "";
    message.current_user_id = object.current_user_id ?? undefined;
    return message;
  },
};

function createBaseGetTagResponse(): GetTagResponse {
  return { id: "", name: "", story_count: 0, follower_count: 0, created_at: "", is_following: false };
}

export const GetTagResponse = {
  encode(message: GetTagResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.story_count !== 0) {
      writer.uint32(24).uint32(message.story_count);
    }
    if (message.follower_count !== 0) {
      writer.uint32(32).uint32(message.follower_count);
    }
    if (message.created_at !== "") {
      writer.uint32(42).string(message.created_at);
    }
    if (message.is_following === true) {
      writer.uint32(48).bool(message.is_following);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagResponse();
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
          if (tag !== 24) {
            break;
          }

          message.story_count = reader.uint32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.follower_count = reader.uint32();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.is_following = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetTagResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      story_count: isSet(object.story_count) ? globalThis.Number(object.story_count) : 0,
      follower_count: isSet(object.follower_count) ? globalThis.Number(object.follower_count) : 0,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      is_following: isSet(object.is_following) ? globalThis.Boolean(object.is_following) : false,
    };
  },

  toJSON(message: GetTagResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.story_count !== 0) {
      obj.story_count = Math.round(message.story_count);
    }
    if (message.follower_count !== 0) {
      obj.follower_count = Math.round(message.follower_count);
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.is_following === true) {
      obj.is_following = message.is_following;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagResponse>, I>>(base?: I): GetTagResponse {
    return GetTagResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagResponse>, I>>(object: I): GetTagResponse {
    const message = createBaseGetTagResponse();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.story_count = object.story_count ?? 0;
    message.follower_count = object.follower_count ?? 0;
    message.created_at = object.created_at ?? "";
    message.is_following = object.is_following ?? false;
    return message;
  },
};

function createBaseGetFollowedTagCountRequest(): GetFollowedTagCountRequest {
  return { id: "" };
}

export const GetFollowedTagCountRequest = {
  encode(message: GetFollowedTagCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetFollowedTagCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetFollowedTagCountRequest();
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

  fromJSON(object: any): GetFollowedTagCountRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetFollowedTagCountRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetFollowedTagCountRequest>, I>>(base?: I): GetFollowedTagCountRequest {
    return GetFollowedTagCountRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetFollowedTagCountRequest>, I>>(object: I): GetFollowedTagCountRequest {
    const message = createBaseGetFollowedTagCountRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetFollowedTagCountResponse(): GetFollowedTagCountResponse {
  return { followed_tag_count: 0 };
}

export const GetFollowedTagCountResponse = {
  encode(message: GetFollowedTagCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.followed_tag_count !== 0) {
      writer.uint32(8).uint32(message.followed_tag_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetFollowedTagCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetFollowedTagCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.followed_tag_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetFollowedTagCountResponse {
    return { followed_tag_count: isSet(object.followed_tag_count) ? globalThis.Number(object.followed_tag_count) : 0 };
  },

  toJSON(message: GetFollowedTagCountResponse): unknown {
    const obj: any = {};
    if (message.followed_tag_count !== 0) {
      obj.followed_tag_count = Math.round(message.followed_tag_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetFollowedTagCountResponse>, I>>(base?: I): GetFollowedTagCountResponse {
    return GetFollowedTagCountResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetFollowedTagCountResponse>, I>>(object: I): GetFollowedTagCountResponse {
    const message = createBaseGetFollowedTagCountResponse();
    message.followed_tag_count = object.followed_tag_count ?? 0;
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
