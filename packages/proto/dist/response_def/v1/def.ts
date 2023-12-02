/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "response_def.v1";

export interface GetResponsesInfoRequest {
  user_id: string;
}

export interface GetResponsesInfoResponse {
  comment_count: number;
  reply_count: number;
}

export interface GetStoryResponsesInfoRequest {
  user_id: string;
  story_id: string;
}

export interface GetStoryResponsesInfoResponse {
  total_count: number;
  hidden_count: number;
}

function createBaseGetResponsesInfoRequest(): GetResponsesInfoRequest {
  return { user_id: "" };
}

export const GetResponsesInfoRequest = {
  encode(message: GetResponsesInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetResponsesInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetResponsesInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.user_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetResponsesInfoRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetResponsesInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetResponsesInfoRequest>, I>>(base?: I): GetResponsesInfoRequest {
    return GetResponsesInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetResponsesInfoRequest>, I>>(object: I): GetResponsesInfoRequest {
    const message = createBaseGetResponsesInfoRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetResponsesInfoResponse(): GetResponsesInfoResponse {
  return { comment_count: 0, reply_count: 0 };
}

export const GetResponsesInfoResponse = {
  encode(message: GetResponsesInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.comment_count !== 0) {
      writer.uint32(8).uint32(message.comment_count);
    }
    if (message.reply_count !== 0) {
      writer.uint32(16).uint32(message.reply_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetResponsesInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetResponsesInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.comment_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.reply_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetResponsesInfoResponse {
    return {
      comment_count: isSet(object.comment_count) ? globalThis.Number(object.comment_count) : 0,
      reply_count: isSet(object.reply_count) ? globalThis.Number(object.reply_count) : 0,
    };
  },

  toJSON(message: GetResponsesInfoResponse): unknown {
    const obj: any = {};
    if (message.comment_count !== 0) {
      obj.comment_count = Math.round(message.comment_count);
    }
    if (message.reply_count !== 0) {
      obj.reply_count = Math.round(message.reply_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetResponsesInfoResponse>, I>>(base?: I): GetResponsesInfoResponse {
    return GetResponsesInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetResponsesInfoResponse>, I>>(object: I): GetResponsesInfoResponse {
    const message = createBaseGetResponsesInfoResponse();
    message.comment_count = object.comment_count ?? 0;
    message.reply_count = object.reply_count ?? 0;
    return message;
  },
};

function createBaseGetStoryResponsesInfoRequest(): GetStoryResponsesInfoRequest {
  return { user_id: "", story_id: "" };
}

export const GetStoryResponsesInfoRequest = {
  encode(message: GetStoryResponsesInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    if (message.story_id !== "") {
      writer.uint32(18).string(message.story_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryResponsesInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryResponsesInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.story_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetStoryResponsesInfoRequest {
    return {
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
      story_id: isSet(object.story_id) ? globalThis.String(object.story_id) : "",
    };
  },

  toJSON(message: GetStoryResponsesInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    if (message.story_id !== "") {
      obj.story_id = message.story_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryResponsesInfoRequest>, I>>(base?: I): GetStoryResponsesInfoRequest {
    return GetStoryResponsesInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryResponsesInfoRequest>, I>>(object: I): GetStoryResponsesInfoRequest {
    const message = createBaseGetStoryResponsesInfoRequest();
    message.user_id = object.user_id ?? "";
    message.story_id = object.story_id ?? "";
    return message;
  },
};

function createBaseGetStoryResponsesInfoResponse(): GetStoryResponsesInfoResponse {
  return { total_count: 0, hidden_count: 0 };
}

export const GetStoryResponsesInfoResponse = {
  encode(message: GetStoryResponsesInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.total_count !== 0) {
      writer.uint32(8).uint32(message.total_count);
    }
    if (message.hidden_count !== 0) {
      writer.uint32(16).uint32(message.hidden_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryResponsesInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryResponsesInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.total_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.hidden_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetStoryResponsesInfoResponse {
    return {
      total_count: isSet(object.total_count) ? globalThis.Number(object.total_count) : 0,
      hidden_count: isSet(object.hidden_count) ? globalThis.Number(object.hidden_count) : 0,
    };
  },

  toJSON(message: GetStoryResponsesInfoResponse): unknown {
    const obj: any = {};
    if (message.total_count !== 0) {
      obj.total_count = Math.round(message.total_count);
    }
    if (message.hidden_count !== 0) {
      obj.hidden_count = Math.round(message.hidden_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryResponsesInfoResponse>, I>>(base?: I): GetStoryResponsesInfoResponse {
    return GetStoryResponsesInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryResponsesInfoResponse>, I>>(
    object: I,
  ): GetStoryResponsesInfoResponse {
    const message = createBaseGetStoryResponsesInfoResponse();
    message.total_count = object.total_count ?? 0;
    message.hidden_count = object.hidden_count ?? 0;
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
