/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "response_def.v1";

export interface GetResponsesInfoRequest {
  id: string;
}

export interface GetResponsesInfoResponse {
  comment_count: number;
  reply_count: number;
}

function createBaseGetResponsesInfoRequest(): GetResponsesInfoRequest {
  return { id: "" };
}

export const GetResponsesInfoRequest = {
  encode(message: GetResponsesInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
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

  fromJSON(object: any): GetResponsesInfoRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetResponsesInfoRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetResponsesInfoRequest>, I>>(base?: I): GetResponsesInfoRequest {
    return GetResponsesInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetResponsesInfoRequest>, I>>(object: I): GetResponsesInfoRequest {
    const message = createBaseGetResponsesInfoRequest();
    message.id = object.id ?? "";
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
      comment_count: isSet(object.comment_count) ? Number(object.comment_count) : 0,
      reply_count: isSet(object.reply_count) ? Number(object.reply_count) : 0,
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
