/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "connection_def.v1";

export const Provider = {
  UNSPECIFIED: 0,
  TWITTER: 1,
  GITHUB: 2,
  TWITCH: 3,
  SPOTIFY: 4,
  REDDIT: 5,
  FACEBOOK: 6,
  INSTAGRAM: 7,
  DISCORD: 8,
  YOUTUBE: 9,
  LINKED_IN: 10,
  FIGMA: 11,
  DRIBBBLE: 12,
  SNAPCHAT: 13,
  UNRECOGNIZED: -1,
} as const;

export type Provider = typeof Provider[keyof typeof Provider];

export function providerFromJSON(object: any): Provider {
  switch (object) {
    case 0:
    case "PROVIDER_UNSPECIFIED":
      return Provider.UNSPECIFIED;
    case 1:
    case "PROVIDER_TWITTER":
      return Provider.TWITTER;
    case 2:
    case "PROVIDER_GITHUB":
      return Provider.GITHUB;
    case 3:
    case "PROVIDER_TWITCH":
      return Provider.TWITCH;
    case 4:
    case "PROVIDER_SPOTIFY":
      return Provider.SPOTIFY;
    case 5:
    case "PROVIDER_REDDIT":
      return Provider.REDDIT;
    case 6:
    case "PROVIDER_FACEBOOK":
      return Provider.FACEBOOK;
    case 7:
    case "PROVIDER_INSTAGRAM":
      return Provider.INSTAGRAM;
    case 8:
    case "PROVIDER_DISCORD":
      return Provider.DISCORD;
    case 9:
    case "PROVIDER_YOUTUBE":
      return Provider.YOUTUBE;
    case 10:
    case "PROVIDER_LINKED_IN":
      return Provider.LINKED_IN;
    case 11:
    case "PROVIDER_FIGMA":
      return Provider.FIGMA;
    case 12:
    case "PROVIDER_DRIBBBLE":
      return Provider.DRIBBBLE;
    case 13:
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
    case Provider.TWITTER:
      return "PROVIDER_TWITTER";
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
}

function createBaseConnection(): Connection {
  return { provider: 0, url: "" };
}

export const Connection = {
  encode(message: Connection, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.provider !== 0) {
      writer.uint32(8).int32(message.provider);
    }
    if (message.url !== "") {
      writer.uint32(18).string(message.url);
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
      url: isSet(object.url) ? String(object.url) : "",
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
    return obj;
  },

  create<I extends Exact<DeepPartial<Connection>, I>>(base?: I): Connection {
    return Connection.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Connection>, I>>(object: I): Connection {
    const message = createBaseConnection();
    message.provider = object.provider ?? 0;
    message.url = object.url ?? "";
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
