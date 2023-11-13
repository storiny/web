/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { User } from "../../user_def/v1/def";

export const protobufPackage = "comment_def.v1";

export interface GetCommentRequest {
  id: string;
  token?: string | undefined;
}

export interface GetCommentResponse {
  id: string;
  content: string;
  rendered_content: string;
  user_id: string;
  story_id: string;
  story_slug: string;
  story_writer_username: string;
  hidden: boolean;
  edited_at?: string | undefined;
  created_at: string;
  like_count: number;
  reply_count: number;
  user:
    | User
    | undefined;
  /** User specific props */
  is_liked: boolean;
}

function createBaseGetCommentRequest(): GetCommentRequest {
  return { id: "", token: undefined };
}

export const GetCommentRequest = {
  encode(message: GetCommentRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.token !== undefined) {
      writer.uint32(18).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetCommentRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetCommentRequest();
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

  fromJSON(object: any): GetCommentRequest {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      token: isSet(object.token) ? globalThis.String(object.token) : undefined,
    };
  },

  toJSON(message: GetCommentRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.token !== undefined) {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetCommentRequest>, I>>(base?: I): GetCommentRequest {
    return GetCommentRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetCommentRequest>, I>>(object: I): GetCommentRequest {
    const message = createBaseGetCommentRequest();
    message.id = object.id ?? "";
    message.token = object.token ?? undefined;
    return message;
  },
};

function createBaseGetCommentResponse(): GetCommentResponse {
  return {
    id: "",
    content: "",
    rendered_content: "",
    user_id: "",
    story_id: "",
    story_slug: "",
    story_writer_username: "",
    hidden: false,
    edited_at: undefined,
    created_at: "",
    like_count: 0,
    reply_count: 0,
    user: undefined,
    is_liked: false,
  };
}

export const GetCommentResponse = {
  encode(message: GetCommentResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.content !== "") {
      writer.uint32(18).string(message.content);
    }
    if (message.rendered_content !== "") {
      writer.uint32(26).string(message.rendered_content);
    }
    if (message.user_id !== "") {
      writer.uint32(34).string(message.user_id);
    }
    if (message.story_id !== "") {
      writer.uint32(42).string(message.story_id);
    }
    if (message.story_slug !== "") {
      writer.uint32(50).string(message.story_slug);
    }
    if (message.story_writer_username !== "") {
      writer.uint32(58).string(message.story_writer_username);
    }
    if (message.hidden === true) {
      writer.uint32(64).bool(message.hidden);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(74).string(message.edited_at);
    }
    if (message.created_at !== "") {
      writer.uint32(82).string(message.created_at);
    }
    if (message.like_count !== 0) {
      writer.uint32(88).uint32(message.like_count);
    }
    if (message.reply_count !== 0) {
      writer.uint32(96).uint32(message.reply_count);
    }
    if (message.user !== undefined) {
      User.encode(message.user, writer.uint32(106).fork()).ldelim();
    }
    if (message.is_liked === true) {
      writer.uint32(112).bool(message.is_liked);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetCommentResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetCommentResponse();
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

          message.content = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.rendered_content = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.story_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.story_slug = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.story_writer_username = reader.string();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.hidden = reader.bool();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.edited_at = reader.string();
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

          message.like_count = reader.uint32();
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.reply_count = reader.uint32();
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.user = User.decode(reader, reader.uint32());
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.is_liked = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetCommentResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      content: isSet(object.content) ? globalThis.String(object.content) : "",
      rendered_content: isSet(object.rendered_content) ? globalThis.String(object.rendered_content) : "",
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
      story_id: isSet(object.story_id) ? globalThis.String(object.story_id) : "",
      story_slug: isSet(object.story_slug) ? globalThis.String(object.story_slug) : "",
      story_writer_username: isSet(object.story_writer_username) ? globalThis.String(object.story_writer_username) : "",
      hidden: isSet(object.hidden) ? globalThis.Boolean(object.hidden) : false,
      edited_at: isSet(object.edited_at) ? globalThis.String(object.edited_at) : undefined,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      like_count: isSet(object.like_count) ? globalThis.Number(object.like_count) : 0,
      reply_count: isSet(object.reply_count) ? globalThis.Number(object.reply_count) : 0,
      user: isSet(object.user) ? User.fromJSON(object.user) : undefined,
      is_liked: isSet(object.is_liked) ? globalThis.Boolean(object.is_liked) : false,
    };
  },

  toJSON(message: GetCommentResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.content !== "") {
      obj.content = message.content;
    }
    if (message.rendered_content !== "") {
      obj.rendered_content = message.rendered_content;
    }
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    if (message.story_id !== "") {
      obj.story_id = message.story_id;
    }
    if (message.story_slug !== "") {
      obj.story_slug = message.story_slug;
    }
    if (message.story_writer_username !== "") {
      obj.story_writer_username = message.story_writer_username;
    }
    if (message.hidden === true) {
      obj.hidden = message.hidden;
    }
    if (message.edited_at !== undefined) {
      obj.edited_at = message.edited_at;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.like_count !== 0) {
      obj.like_count = Math.round(message.like_count);
    }
    if (message.reply_count !== 0) {
      obj.reply_count = Math.round(message.reply_count);
    }
    if (message.user !== undefined) {
      obj.user = User.toJSON(message.user);
    }
    if (message.is_liked === true) {
      obj.is_liked = message.is_liked;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetCommentResponse>, I>>(base?: I): GetCommentResponse {
    return GetCommentResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetCommentResponse>, I>>(object: I): GetCommentResponse {
    const message = createBaseGetCommentResponse();
    message.id = object.id ?? "";
    message.content = object.content ?? "";
    message.rendered_content = object.rendered_content ?? "";
    message.user_id = object.user_id ?? "";
    message.story_id = object.story_id ?? "";
    message.story_slug = object.story_slug ?? "";
    message.story_writer_username = object.story_writer_username ?? "";
    message.hidden = object.hidden ?? false;
    message.edited_at = object.edited_at ?? undefined;
    message.created_at = object.created_at ?? "";
    message.like_count = object.like_count ?? 0;
    message.reply_count = object.reply_count ?? 0;
    message.user = (object.user !== undefined && object.user !== null) ? User.fromPartial(object.user) : undefined;
    message.is_liked = object.is_liked ?? false;
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
