/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "open_graph_def.v1";

export interface GetStoryOpenGraphDataRequest {
  id: string;
}

export interface GetStoryOpenGraphDataResponse {
  id: string;
  title: string;
  description?: string | undefined;
  splash_id?: string | undefined;
  like_count: number;
  read_count: number;
  comment_count: number;
  is_private: boolean;
  /** User */
  user_name: string;
  user_avatar_id?: string | undefined;
}

export interface GetTagOpenGraphDataRequest {
  id: string;
}

export interface GetTagOpenGraphDataResponse {
  id: string;
  name: string;
  story_count: number;
  follower_count: number;
}

function createBaseGetStoryOpenGraphDataRequest(): GetStoryOpenGraphDataRequest {
  return { id: "" };
}

export const GetStoryOpenGraphDataRequest = {
  encode(message: GetStoryOpenGraphDataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryOpenGraphDataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryOpenGraphDataRequest();
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

  fromJSON(object: any): GetStoryOpenGraphDataRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetStoryOpenGraphDataRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryOpenGraphDataRequest>, I>>(base?: I): GetStoryOpenGraphDataRequest {
    return GetStoryOpenGraphDataRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryOpenGraphDataRequest>, I>>(object: I): GetStoryOpenGraphDataRequest {
    const message = createBaseGetStoryOpenGraphDataRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetStoryOpenGraphDataResponse(): GetStoryOpenGraphDataResponse {
  return {
    id: "",
    title: "",
    description: undefined,
    splash_id: undefined,
    like_count: 0,
    read_count: 0,
    comment_count: 0,
    is_private: false,
    user_name: "",
    user_avatar_id: undefined,
  };
}

export const GetStoryOpenGraphDataResponse = {
  encode(message: GetStoryOpenGraphDataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.title !== "") {
      writer.uint32(18).string(message.title);
    }
    if (message.description !== undefined) {
      writer.uint32(26).string(message.description);
    }
    if (message.splash_id !== undefined) {
      writer.uint32(34).string(message.splash_id);
    }
    if (message.like_count !== 0) {
      writer.uint32(40).uint32(message.like_count);
    }
    if (message.read_count !== 0) {
      writer.uint32(48).uint32(message.read_count);
    }
    if (message.comment_count !== 0) {
      writer.uint32(56).uint32(message.comment_count);
    }
    if (message.is_private === true) {
      writer.uint32(64).bool(message.is_private);
    }
    if (message.user_name !== "") {
      writer.uint32(74).string(message.user_name);
    }
    if (message.user_avatar_id !== undefined) {
      writer.uint32(82).string(message.user_avatar_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryOpenGraphDataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryOpenGraphDataResponse();
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

          message.title = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.description = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.splash_id = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.like_count = reader.uint32();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.read_count = reader.uint32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.comment_count = reader.uint32();
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

          message.user_name = reader.string();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.user_avatar_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetStoryOpenGraphDataResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      title: isSet(object.title) ? globalThis.String(object.title) : "",
      description: isSet(object.description) ? globalThis.String(object.description) : undefined,
      splash_id: isSet(object.splash_id) ? globalThis.String(object.splash_id) : undefined,
      like_count: isSet(object.like_count) ? globalThis.Number(object.like_count) : 0,
      read_count: isSet(object.read_count) ? globalThis.Number(object.read_count) : 0,
      comment_count: isSet(object.comment_count) ? globalThis.Number(object.comment_count) : 0,
      is_private: isSet(object.is_private) ? globalThis.Boolean(object.is_private) : false,
      user_name: isSet(object.user_name) ? globalThis.String(object.user_name) : "",
      user_avatar_id: isSet(object.user_avatar_id) ? globalThis.String(object.user_avatar_id) : undefined,
    };
  },

  toJSON(message: GetStoryOpenGraphDataResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.title !== "") {
      obj.title = message.title;
    }
    if (message.description !== undefined) {
      obj.description = message.description;
    }
    if (message.splash_id !== undefined) {
      obj.splash_id = message.splash_id;
    }
    if (message.like_count !== 0) {
      obj.like_count = Math.round(message.like_count);
    }
    if (message.read_count !== 0) {
      obj.read_count = Math.round(message.read_count);
    }
    if (message.comment_count !== 0) {
      obj.comment_count = Math.round(message.comment_count);
    }
    if (message.is_private === true) {
      obj.is_private = message.is_private;
    }
    if (message.user_name !== "") {
      obj.user_name = message.user_name;
    }
    if (message.user_avatar_id !== undefined) {
      obj.user_avatar_id = message.user_avatar_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryOpenGraphDataResponse>, I>>(base?: I): GetStoryOpenGraphDataResponse {
    return GetStoryOpenGraphDataResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryOpenGraphDataResponse>, I>>(
    object: I,
  ): GetStoryOpenGraphDataResponse {
    const message = createBaseGetStoryOpenGraphDataResponse();
    message.id = object.id ?? "";
    message.title = object.title ?? "";
    message.description = object.description ?? undefined;
    message.splash_id = object.splash_id ?? undefined;
    message.like_count = object.like_count ?? 0;
    message.read_count = object.read_count ?? 0;
    message.comment_count = object.comment_count ?? 0;
    message.is_private = object.is_private ?? false;
    message.user_name = object.user_name ?? "";
    message.user_avatar_id = object.user_avatar_id ?? undefined;
    return message;
  },
};

function createBaseGetTagOpenGraphDataRequest(): GetTagOpenGraphDataRequest {
  return { id: "" };
}

export const GetTagOpenGraphDataRequest = {
  encode(message: GetTagOpenGraphDataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagOpenGraphDataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagOpenGraphDataRequest();
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

  fromJSON(object: any): GetTagOpenGraphDataRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetTagOpenGraphDataRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagOpenGraphDataRequest>, I>>(base?: I): GetTagOpenGraphDataRequest {
    return GetTagOpenGraphDataRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagOpenGraphDataRequest>, I>>(object: I): GetTagOpenGraphDataRequest {
    const message = createBaseGetTagOpenGraphDataRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetTagOpenGraphDataResponse(): GetTagOpenGraphDataResponse {
  return { id: "", name: "", story_count: 0, follower_count: 0 };
}

export const GetTagOpenGraphDataResponse = {
  encode(message: GetTagOpenGraphDataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTagOpenGraphDataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTagOpenGraphDataResponse();
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
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetTagOpenGraphDataResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      story_count: isSet(object.story_count) ? globalThis.Number(object.story_count) : 0,
      follower_count: isSet(object.follower_count) ? globalThis.Number(object.follower_count) : 0,
    };
  },

  toJSON(message: GetTagOpenGraphDataResponse): unknown {
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
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTagOpenGraphDataResponse>, I>>(base?: I): GetTagOpenGraphDataResponse {
    return GetTagOpenGraphDataResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTagOpenGraphDataResponse>, I>>(object: I): GetTagOpenGraphDataResponse {
    const message = createBaseGetTagOpenGraphDataResponse();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.story_count = object.story_count ?? 0;
    message.follower_count = object.follower_count ?? 0;
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
