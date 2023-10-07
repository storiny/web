/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "credential_settings_def.v1";

export interface GetCredentialSettingsRequest {
  /** User ID */
  id: string;
}

export interface GetCredentialSettingsResponse {
  has_password: boolean;
  mfa_enabled: boolean;
  login_apple_id?: string | undefined;
  login_google_id?: string | undefined;
}

function createBaseGetCredentialSettingsRequest(): GetCredentialSettingsRequest {
  return { id: "" };
}

export const GetCredentialSettingsRequest = {
  encode(message: GetCredentialSettingsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetCredentialSettingsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetCredentialSettingsRequest();
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

  fromJSON(object: any): GetCredentialSettingsRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetCredentialSettingsRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetCredentialSettingsRequest>, I>>(base?: I): GetCredentialSettingsRequest {
    return GetCredentialSettingsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetCredentialSettingsRequest>, I>>(object: I): GetCredentialSettingsRequest {
    const message = createBaseGetCredentialSettingsRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetCredentialSettingsResponse(): GetCredentialSettingsResponse {
  return { has_password: false, mfa_enabled: false, login_apple_id: undefined, login_google_id: undefined };
}

export const GetCredentialSettingsResponse = {
  encode(message: GetCredentialSettingsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.has_password === true) {
      writer.uint32(8).bool(message.has_password);
    }
    if (message.mfa_enabled === true) {
      writer.uint32(16).bool(message.mfa_enabled);
    }
    if (message.login_apple_id !== undefined) {
      writer.uint32(26).string(message.login_apple_id);
    }
    if (message.login_google_id !== undefined) {
      writer.uint32(34).string(message.login_google_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetCredentialSettingsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetCredentialSettingsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.has_password = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.mfa_enabled = reader.bool();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.login_apple_id = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.login_google_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetCredentialSettingsResponse {
    return {
      has_password: isSet(object.has_password) ? globalThis.Boolean(object.has_password) : false,
      mfa_enabled: isSet(object.mfa_enabled) ? globalThis.Boolean(object.mfa_enabled) : false,
      login_apple_id: isSet(object.login_apple_id) ? globalThis.String(object.login_apple_id) : undefined,
      login_google_id: isSet(object.login_google_id) ? globalThis.String(object.login_google_id) : undefined,
    };
  },

  toJSON(message: GetCredentialSettingsResponse): unknown {
    const obj: any = {};
    if (message.has_password === true) {
      obj.has_password = message.has_password;
    }
    if (message.mfa_enabled === true) {
      obj.mfa_enabled = message.mfa_enabled;
    }
    if (message.login_apple_id !== undefined) {
      obj.login_apple_id = message.login_apple_id;
    }
    if (message.login_google_id !== undefined) {
      obj.login_google_id = message.login_google_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetCredentialSettingsResponse>, I>>(base?: I): GetCredentialSettingsResponse {
    return GetCredentialSettingsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetCredentialSettingsResponse>, I>>(
    object: I,
  ): GetCredentialSettingsResponse {
    const message = createBaseGetCredentialSettingsResponse();
    message.has_password = object.has_password ?? false;
    message.mfa_enabled = object.mfa_enabled ?? false;
    message.login_apple_id = object.login_apple_id ?? undefined;
    message.login_google_id = object.login_google_id ?? undefined;
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
