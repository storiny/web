/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { ConnectionSetting } from "../../connection_def/v1/def";

export const protobufPackage = "connection_settings_def.v1";

export interface GetConnectionSettingsRequest {
  id: string;
}

export interface GetConnectionSettingsResponse {
  connections: ConnectionSetting[];
}

function createBaseGetConnectionSettingsRequest(): GetConnectionSettingsRequest {
  return { id: "" };
}

export const GetConnectionSettingsRequest = {
  encode(message: GetConnectionSettingsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectionSettingsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectionSettingsRequest();
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

  fromJSON(object: any): GetConnectionSettingsRequest {
    return { id: isSet(object.id) ? String(object.id) : "" };
  },

  toJSON(message: GetConnectionSettingsRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectionSettingsRequest>, I>>(base?: I): GetConnectionSettingsRequest {
    return GetConnectionSettingsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetConnectionSettingsRequest>, I>>(object: I): GetConnectionSettingsRequest {
    const message = createBaseGetConnectionSettingsRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetConnectionSettingsResponse(): GetConnectionSettingsResponse {
  return { connections: [] };
}

export const GetConnectionSettingsResponse = {
  encode(message: GetConnectionSettingsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.connections) {
      ConnectionSetting.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectionSettingsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectionSettingsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.connections.push(ConnectionSetting.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetConnectionSettingsResponse {
    return {
      connections: globalThis.Array.isArray(object?.connections)
        ? object.connections.map((e: any) => ConnectionSetting.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GetConnectionSettingsResponse): unknown {
    const obj: any = {};
    if (message.connections?.length) {
      obj.connections = message.connections.map((e) => ConnectionSetting.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectionSettingsResponse>, I>>(base?: I): GetConnectionSettingsResponse {
    return GetConnectionSettingsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetConnectionSettingsResponse>, I>>(
    object: I,
  ): GetConnectionSettingsResponse {
    const message = createBaseGetConnectionSettingsResponse();
    message.connections = object.connections?.map((e) => ConnectionSetting.fromPartial(e)) || [];
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
