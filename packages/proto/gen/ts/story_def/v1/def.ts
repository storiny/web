/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "story_def.v1";

export interface Story {
  id: string;
  title: string;
  slug: string;
  description?: string | undefined;
  splash_id?: string | undefined;
  splash_hex?: string | undefined;
  like_count: number;
  read_count: number;
  word_count: number;
  created_at: string;
  edited_at?: string | undefined;
  published_at?: string | undefined;
}

export interface GetDraftsInfoRequest {
  id: string;
}

export interface GetDraftsInfoResponse {
  pending_drafts_count: number;
  deleted_drafts_count: number;
  latest_draft?: Story | undefined;
}

function createBaseStory(): Story {
  return {
    id: "",
    title: "",
    slug: "",
    description: undefined,
    splash_id: undefined,
    splash_hex: undefined,
    like_count: 0,
    read_count: 0,
    word_count: 0,
    created_at: "",
    edited_at: undefined,
    published_at: undefined,
  };
}

export const Story = {
  encode(message: Story, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.title !== "") {
      writer.uint32(18).string(message.title);
    }
    if (message.slug !== "") {
      writer.uint32(26).string(message.slug);
    }
    if (message.description !== undefined) {
      writer.uint32(34).string(message.description);
    }
    if (message.splash_id !== undefined) {
      writer.uint32(42).string(message.splash_id);
    }
    if (message.splash_hex !== undefined) {
      writer.uint32(50).string(message.splash_hex);
    }
    if (message.like_count !== 0) {
      writer.uint32(56).uint64(message.like_count);
    }
    if (message.read_count !== 0) {
      writer.uint32(64).uint64(message.read_count);
    }
    if (message.word_count !== 0) {
      writer.uint32(72).uint32(message.word_count);
    }
    if (message.created_at !== "") {
      writer.uint32(82).string(message.created_at);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(90).string(message.edited_at);
    }
    if (message.published_at !== undefined) {
      writer.uint32(98).string(message.published_at);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Story {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStory();
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

          message.slug = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.description = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.splash_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.splash_hex = reader.string();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.like_count = longToNumber(reader.uint64() as Long);
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.read_count = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.word_count = reader.uint32();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.edited_at = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.published_at = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Story {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      title: isSet(object.title) ? String(object.title) : "",
      slug: isSet(object.slug) ? String(object.slug) : "",
      description: isSet(object.description) ? String(object.description) : undefined,
      splash_id: isSet(object.splash_id) ? String(object.splash_id) : undefined,
      splash_hex: isSet(object.splash_hex) ? String(object.splash_hex) : undefined,
      like_count: isSet(object.like_count) ? Number(object.like_count) : 0,
      read_count: isSet(object.read_count) ? Number(object.read_count) : 0,
      word_count: isSet(object.word_count) ? Number(object.word_count) : 0,
      created_at: isSet(object.created_at) ? String(object.created_at) : "",
      edited_at: isSet(object.edited_at) ? String(object.edited_at) : undefined,
      published_at: isSet(object.published_at) ? String(object.published_at) : undefined,
    };
  },

  toJSON(message: Story): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.title !== "") {
      obj.title = message.title;
    }
    if (message.slug !== "") {
      obj.slug = message.slug;
    }
    if (message.description !== undefined) {
      obj.description = message.description;
    }
    if (message.splash_id !== undefined) {
      obj.splash_id = message.splash_id;
    }
    if (message.splash_hex !== undefined) {
      obj.splash_hex = message.splash_hex;
    }
    if (message.like_count !== 0) {
      obj.like_count = Math.round(message.like_count);
    }
    if (message.read_count !== 0) {
      obj.read_count = Math.round(message.read_count);
    }
    if (message.word_count !== 0) {
      obj.word_count = Math.round(message.word_count);
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.edited_at !== undefined) {
      obj.edited_at = message.edited_at;
    }
    if (message.published_at !== undefined) {
      obj.published_at = message.published_at;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Story>, I>>(base?: I): Story {
    return Story.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Story>, I>>(object: I): Story {
    const message = createBaseStory();
    message.id = object.id ?? "";
    message.title = object.title ?? "";
    message.slug = object.slug ?? "";
    message.description = object.description ?? undefined;
    message.splash_id = object.splash_id ?? undefined;
    message.splash_hex = object.splash_hex ?? undefined;
    message.like_count = object.like_count ?? 0;
    message.read_count = object.read_count ?? 0;
    message.word_count = object.word_count ?? 0;
    message.created_at = object.created_at ?? "";
    message.edited_at = object.edited_at ?? undefined;
    message.published_at = object.published_at ?? undefined;
    return message;
  },
};

function createBaseGetDraftsInfoRequest(): GetDraftsInfoRequest {
  return { id: "" };
}

export const GetDraftsInfoRequest = {
  encode(message: GetDraftsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetDraftsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDraftsInfoRequest();
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

  fromJSON(object: any): GetDraftsInfoRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetDraftsInfoRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(base?: I): GetDraftsInfoRequest {
    return GetDraftsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(object: I): GetDraftsInfoRequest {
    const message = createBaseGetDraftsInfoRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetDraftsInfoResponse(): GetDraftsInfoResponse {
  return { pending_drafts_count: 0, deleted_drafts_count: 0, latest_draft: undefined };
}

export const GetDraftsInfoResponse = {
  encode(message: GetDraftsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pending_drafts_count !== 0) {
      writer.uint32(8).uint32(message.pending_drafts_count);
    }
    if (message.deleted_drafts_count !== 0) {
      writer.uint32(16).uint32(message.deleted_drafts_count);
    }
    if (message.latest_draft !== undefined) {
      Story.encode(message.latest_draft, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetDraftsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDraftsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.pending_drafts_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.deleted_drafts_count = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.latest_draft = Story.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetDraftsInfoResponse {
    return {
      pending_drafts_count: isSet(object.pending_drafts_count) ? Number(object.pending_drafts_count) : 0,
      deleted_drafts_count: isSet(object.deleted_drafts_count) ? Number(object.deleted_drafts_count) : 0,
      latest_draft: isSet(object.latest_draft) ? Story.fromJSON(object.latest_draft) : undefined,
    };
  },

  toJSON(message: GetDraftsInfoResponse): unknown {
    const obj: any = {};
    if (message.pending_drafts_count !== 0) {
      obj.pending_drafts_count = Math.round(message.pending_drafts_count);
    }
    if (message.deleted_drafts_count !== 0) {
      obj.deleted_drafts_count = Math.round(message.deleted_drafts_count);
    }
    if (message.latest_draft !== undefined) {
      obj.latest_draft = Story.toJSON(message.latest_draft);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetDraftsInfoResponse>, I>>(base?: I): GetDraftsInfoResponse {
    return GetDraftsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetDraftsInfoResponse>, I>>(object: I): GetDraftsInfoResponse {
    const message = createBaseGetDraftsInfoResponse();
    message.pending_drafts_count = object.pending_drafts_count ?? 0;
    message.deleted_drafts_count = object.deleted_drafts_count ?? 0;
    message.latest_draft = (object.latest_draft !== undefined && object.latest_draft !== null)
      ? Story.fromPartial(object.latest_draft)
      : undefined;
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
