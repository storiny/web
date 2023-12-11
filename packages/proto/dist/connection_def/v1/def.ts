/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "connection_def.v1";

export const Provider = {
  UNSPECIFIED: 0,
  GITHUB: 1,
  TWITCH: 2,
  SPOTIFY: 3,
  REDDIT: 4,
  FACEBOOK: 5,
  INSTAGRAM: 6,
  DISCORD: 7,
  YOUTUBE: 8,
  LINKED_IN: 9,
  FIGMA: 10,
  DRIBBBLE: 11,
  SNAPCHAT: 12,
  UNRECOGNIZED: -1,
} as const;

export type Provider = typeof Provider[keyof typeof Provider];

export function providerFromJSON(object: any): Provider {
  switch (object) {
    case 0:
    case "PROVIDER_UNSPECIFIED":
      return Provider.UNSPECIFIED;
    case 1:
    case "PROVIDER_GITHUB":
      return Provider.GITHUB;
    case 2:
    case "PROVIDER_TWITCH":
      return Provider.TWITCH;
    case 3:
    case "PROVIDER_SPOTIFY":
      return Provider.SPOTIFY;
    case 4:
    case "PROVIDER_REDDIT":
      return Provider.REDDIT;
    case 5:
    case "PROVIDER_FACEBOOK":
      return Provider.FACEBOOK;
    case 6:
    case "PROVIDER_INSTAGRAM":
      return Provider.INSTAGRAM;
    case 7:
    case "PROVIDER_DISCORD":
      return Provider.DISCORD;
    case 8:
    case "PROVIDER_YOUTUBE":
      return Provider.YOUTUBE;
    case 9:
    case "PROVIDER_LINKED_IN":
      return Provider.LINKED_IN;
    case 10:
    case "PROVIDER_FIGMA":
      return Provider.FIGMA;
    case 11:
    case "PROVIDER_DRIBBBLE":
      return Provider.DRIBBBLE;
    case 12:
    case "PROVIDER_SNAPCHAT":
      return Provider.SNAPCHAT;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Provider.UNRECOGNIZED;
  }
}

export function providerToJSON(object: Provider): string {
  switch (object) {
    case Provider.UNSPECIFIED:
      return "PROVIDER_UNSPECIFIED";
    case Provider.GITHUB:
      return "PROVIDER_GITHUB";
    case Provider.TWITCH:
      return "PROVIDER_TWITCH";
    case Provider.SPOTIFY:
      return "PROVIDER_SPOTIFY";
    case Provider.REDDIT:
      return "PROVIDER_REDDIT";
    case Provider.FACEBOOK:
      return "PROVIDER_FACEBOOK";
    case Provider.INSTAGRAM:
      return "PROVIDER_INSTAGRAM";
    case Provider.DISCORD:
      return "PROVIDER_DISCORD";
    case Provider.YOUTUBE:
      return "PROVIDER_YOUTUBE";
    case Provider.LINKED_IN:
      return "PROVIDER_LINKED_IN";
    case Provider.FIGMA:
      return "PROVIDER_FIGMA";
    case Provider.DRIBBBLE:
      return "PROVIDER_DRIBBBLE";
    case Provider.SNAPCHAT:
      return "PROVIDER_SNAPCHAT";
    case Provider.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Connection {
  provider: Provider;
  url: string;
  display_name: string;
}

export interface ConnectionSetting {
  id: string;
  provider: Provider;
  hidden: boolean;
  display_name: string;
  url: string;
  created_at: string;
}

function createBaseConnection(): Connection {
  return { provider: 0, url: "", display_name: "" };
}

export const Connection = {
  encode(message: Connection, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.provider !== 0) {
      writer.uint32(8).int32(message.provider);
    }
    if (message.url !== "") {
      writer.uint32(18).string(message.url);
    }
    if (message.display_name !== "") {
      writer.uint32(26).string(message.display_name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Connection {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnection();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.provider = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.url = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.display_name = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Connection {
    return {
      provider: isSet(object.provider) ? providerFromJSON(object.provider) : 0,
      url: isSet(object.url) ? globalThis.String(object.url) : "",
      display_name: isSet(object.display_name) ? globalThis.String(object.display_name) : "",
    };
  },

  toJSON(message: Connection): unknown {
    const obj: any = {};
    if (message.provider !== 0) {
      obj.provider = providerToJSON(message.provider);
    }
    if (message.url !== "") {
      obj.url = message.url;
    }
    if (message.display_name !== "") {
      obj.display_name = message.display_name;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Connection>, I>>(base?: I): Connection {
    return Connection.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Connection>, I>>(object: I): Connection {
    const message = createBaseConnection();
    message.provider = object.provider ?? 0;
    message.url = object.url ?? "";
    message.display_name = object.display_name ?? "";
    return message;
  },
};

function createBaseConnectionSetting(): ConnectionSetting {
  return { id: "", provider: 0, hidden: false, display_name: "", url: "", created_at: "" };
}

export const ConnectionSetting = {
  encode(message: ConnectionSetting, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.provider !== 0) {
      writer.uint32(16).int32(message.provider);
    }
    if (message.hidden === true) {
      writer.uint32(24).bool(message.hidden);
    }
    if (message.display_name !== "") {
      writer.uint32(34).string(message.display_name);
    }
    if (message.url !== "") {
      writer.uint32(42).string(message.url);
    }
    if (message.created_at !== "") {
      writer.uint32(50).string(message.created_at);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectionSetting {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectionSetting();
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
          if (tag !== 16) {
            break;
          }

          message.provider = reader.int32() as any;
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.hidden = reader.bool();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.display_name = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.url = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.created_at = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConnectionSetting {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      provider: isSet(object.provider) ? providerFromJSON(object.provider) : 0,
      hidden: isSet(object.hidden) ? globalThis.Boolean(object.hidden) : false,
      display_name: isSet(object.display_name) ? globalThis.String(object.display_name) : "",
      url: isSet(object.url) ? globalThis.String(object.url) : "",
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
    };
  },

  toJSON(message: ConnectionSetting): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.provider !== 0) {
      obj.provider = providerToJSON(message.provider);
    }
    if (message.hidden === true) {
      obj.hidden = message.hidden;
    }
    if (message.display_name !== "") {
      obj.display_name = message.display_name;
    }
    if (message.url !== "") {
      obj.url = message.url;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectionSetting>, I>>(base?: I): ConnectionSetting {
    return ConnectionSetting.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ConnectionSetting>, I>>(object: I): ConnectionSetting {
    const message = createBaseConnectionSetting();
    message.id = object.id ?? "";
    message.provider = object.provider ?? 0;
    message.hidden = object.hidden ?? false;
    message.display_name = object.display_name ?? "";
    message.url = object.url ?? "";
    message.created_at = object.created_at ?? "";
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
