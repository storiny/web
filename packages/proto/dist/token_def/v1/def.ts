/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "token_def.v1";

export const TokenType = {
  UNSPECIFIED: 0,
  EMAIL_VERIFICATION: 1,
  PASSWORD_RESET: 2,
  PASSWORD_ADD: 3,
  UNRECOGNIZED: -1,
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export function tokenTypeFromJSON(object: any): TokenType {
  switch (object) {
    case 0:
    case "TOKEN_TYPE_UNSPECIFIED":
      return TokenType.UNSPECIFIED;
    case 1:
    case "TOKEN_TYPE_EMAIL_VERIFICATION":
      return TokenType.EMAIL_VERIFICATION;
    case 2:
    case "TOKEN_TYPE_PASSWORD_RESET":
      return TokenType.PASSWORD_RESET;
    case 3:
    case "TOKEN_TYPE_PASSWORD_ADD":
      return TokenType.PASSWORD_ADD;
    case -1:
    case "UNRECOGNIZED":
    default:
      return TokenType.UNRECOGNIZED;
  }
}

export function tokenTypeToJSON(object: TokenType): string {
  switch (object) {
    case TokenType.UNSPECIFIED:
      return "TOKEN_TYPE_UNSPECIFIED";
    case TokenType.EMAIL_VERIFICATION:
      return "TOKEN_TYPE_EMAIL_VERIFICATION";
    case TokenType.PASSWORD_RESET:
      return "TOKEN_TYPE_PASSWORD_RESET";
    case TokenType.PASSWORD_ADD:
      return "TOKEN_TYPE_PASSWORD_ADD";
    case TokenType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface GetTokenRequest {
  identifier: string;
  type: TokenType;
}

export interface GetTokenResponse {
  is_valid: boolean;
  is_expired: boolean;
}

export interface VerifyEmailRequest {
  identifier: string;
}

export interface VerifyEmailResponse {
}

export interface VerifyNewsletterSubscriptionRequest {
  identifier: string;
}

export interface VerifyNewsletterSubscriptionResponse {
  is_valid: boolean;
}

function createBaseGetTokenRequest(): GetTokenRequest {
  return { identifier: "", type: 0 };
}

export const GetTokenRequest = {
  encode(message: GetTokenRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTokenRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTokenRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.identifier = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetTokenRequest {
    return {
      identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "",
      type: isSet(object.type) ? tokenTypeFromJSON(object.type) : 0,
    };
  },

  toJSON(message: GetTokenRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    if (message.type !== 0) {
      obj.type = tokenTypeToJSON(message.type);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTokenRequest>, I>>(base?: I): GetTokenRequest {
    return GetTokenRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTokenRequest>, I>>(object: I): GetTokenRequest {
    const message = createBaseGetTokenRequest();
    message.identifier = object.identifier ?? "";
    message.type = object.type ?? 0;
    return message;
  },
};

function createBaseGetTokenResponse(): GetTokenResponse {
  return { is_valid: false, is_expired: false };
}

export const GetTokenResponse = {
  encode(message: GetTokenResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.is_valid === true) {
      writer.uint32(8).bool(message.is_valid);
    }
    if (message.is_expired === true) {
      writer.uint32(16).bool(message.is_expired);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetTokenResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetTokenResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.is_valid = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.is_expired = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetTokenResponse {
    return {
      is_valid: isSet(object.is_valid) ? globalThis.Boolean(object.is_valid) : false,
      is_expired: isSet(object.is_expired) ? globalThis.Boolean(object.is_expired) : false,
    };
  },

  toJSON(message: GetTokenResponse): unknown {
    const obj: any = {};
    if (message.is_valid === true) {
      obj.is_valid = message.is_valid;
    }
    if (message.is_expired === true) {
      obj.is_expired = message.is_expired;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetTokenResponse>, I>>(base?: I): GetTokenResponse {
    return GetTokenResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetTokenResponse>, I>>(object: I): GetTokenResponse {
    const message = createBaseGetTokenResponse();
    message.is_valid = object.is_valid ?? false;
    message.is_expired = object.is_expired ?? false;
    return message;
  },
};

function createBaseVerifyEmailRequest(): VerifyEmailRequest {
  return { identifier: "" };
}

export const VerifyEmailRequest = {
  encode(message: VerifyEmailRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyEmailRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyEmailRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.identifier = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerifyEmailRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: VerifyEmailRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyEmailRequest>, I>>(base?: I): VerifyEmailRequest {
    return VerifyEmailRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyEmailRequest>, I>>(object: I): VerifyEmailRequest {
    const message = createBaseVerifyEmailRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseVerifyEmailResponse(): VerifyEmailResponse {
  return {};
}

export const VerifyEmailResponse = {
  encode(_: VerifyEmailResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyEmailResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyEmailResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): VerifyEmailResponse {
    return {};
  },

  toJSON(_: VerifyEmailResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyEmailResponse>, I>>(base?: I): VerifyEmailResponse {
    return VerifyEmailResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyEmailResponse>, I>>(_: I): VerifyEmailResponse {
    const message = createBaseVerifyEmailResponse();
    return message;
  },
};

function createBaseVerifyNewsletterSubscriptionRequest(): VerifyNewsletterSubscriptionRequest {
  return { identifier: "" };
}

export const VerifyNewsletterSubscriptionRequest = {
  encode(message: VerifyNewsletterSubscriptionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyNewsletterSubscriptionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyNewsletterSubscriptionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.identifier = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerifyNewsletterSubscriptionRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: VerifyNewsletterSubscriptionRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyNewsletterSubscriptionRequest>, I>>(
    base?: I,
  ): VerifyNewsletterSubscriptionRequest {
    return VerifyNewsletterSubscriptionRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyNewsletterSubscriptionRequest>, I>>(
    object: I,
  ): VerifyNewsletterSubscriptionRequest {
    const message = createBaseVerifyNewsletterSubscriptionRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseVerifyNewsletterSubscriptionResponse(): VerifyNewsletterSubscriptionResponse {
  return { is_valid: false };
}

export const VerifyNewsletterSubscriptionResponse = {
  encode(message: VerifyNewsletterSubscriptionResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.is_valid === true) {
      writer.uint32(8).bool(message.is_valid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyNewsletterSubscriptionResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyNewsletterSubscriptionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.is_valid = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerifyNewsletterSubscriptionResponse {
    return { is_valid: isSet(object.is_valid) ? globalThis.Boolean(object.is_valid) : false };
  },

  toJSON(message: VerifyNewsletterSubscriptionResponse): unknown {
    const obj: any = {};
    if (message.is_valid === true) {
      obj.is_valid = message.is_valid;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyNewsletterSubscriptionResponse>, I>>(
    base?: I,
  ): VerifyNewsletterSubscriptionResponse {
    return VerifyNewsletterSubscriptionResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyNewsletterSubscriptionResponse>, I>>(
    object: I,
  ): VerifyNewsletterSubscriptionResponse {
    const message = createBaseVerifyNewsletterSubscriptionResponse();
    message.is_valid = object.is_valid ?? false;
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
