/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "user_def.v1";

export const StatusVisibility = { UNSPECIFIED: 0, GLOBAL: 1, FOLLOWERS: 2, FRIENDS: 3, UNRECOGNIZED: -1 } as const;

export type StatusVisibility = typeof StatusVisibility[keyof typeof StatusVisibility];

export function statusVisibilityFromJSON(object: any): StatusVisibility {
  switch (object) {
    case 0:
    case "UNSPECIFIED":
      return StatusVisibility.UNSPECIFIED;
    case 1:
    case "GLOBAL":
      return StatusVisibility.GLOBAL;
    case 2:
    case "FOLLOWERS":
      return StatusVisibility.FOLLOWERS;
    case 3:
    case "FRIENDS":
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
      return "UNSPECIFIED";
    case StatusVisibility.GLOBAL:
      return "GLOBAL";
    case StatusVisibility.FOLLOWERS:
      return "FOLLOWERS";
    case StatusVisibility.FRIENDS:
      return "FRIENDS";
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
