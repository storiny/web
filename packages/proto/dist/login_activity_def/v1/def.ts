/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "login_activity_def.v1";

export const DeviceType = {
  UNSPECIFIED: 0,
  COMPUTER: 1,
  CONSOLE: 2,
  MOBILE: 3,
  SMART_TV: 4,
  TABLET: 5,
  UNKNOWN: 6,
  UNRECOGNIZED: -1,
} as const;

export type DeviceType = typeof DeviceType[keyof typeof DeviceType];

export function deviceTypeFromJSON(object: any): DeviceType {
  switch (object) {
    case 0:
    case "DEVICE_TYPE_UNSPECIFIED":
      return DeviceType.UNSPECIFIED;
    case 1:
    case "DEVICE_TYPE_COMPUTER":
      return DeviceType.COMPUTER;
    case 2:
    case "DEVICE_TYPE_CONSOLE":
      return DeviceType.CONSOLE;
    case 3:
    case "DEVICE_TYPE_MOBILE":
      return DeviceType.MOBILE;
    case 4:
    case "DEVICE_TYPE_SMART_TV":
      return DeviceType.SMART_TV;
    case 5:
    case "DEVICE_TYPE_TABLET":
      return DeviceType.TABLET;
    case 6:
    case "DEVICE_TYPE_UNKNOWN":
      return DeviceType.UNKNOWN;
    case -1:
    case "UNRECOGNIZED":
    default:
      return DeviceType.UNRECOGNIZED;
  }
}

export function deviceTypeToJSON(object: DeviceType): string {
  switch (object) {
    case DeviceType.UNSPECIFIED:
      return "DEVICE_TYPE_UNSPECIFIED";
    case DeviceType.COMPUTER:
      return "DEVICE_TYPE_COMPUTER";
    case DeviceType.CONSOLE:
      return "DEVICE_TYPE_CONSOLE";
    case DeviceType.MOBILE:
      return "DEVICE_TYPE_MOBILE";
    case DeviceType.SMART_TV:
      return "DEVICE_TYPE_SMART_TV";
    case DeviceType.TABLET:
      return "DEVICE_TYPE_TABLET";
    case DeviceType.UNKNOWN:
      return "DEVICE_TYPE_UNKNOWN";
    case DeviceType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Device {
  display_name: string;
  type: DeviceType;
}

export interface Location {
  display_name: string;
  lat?: number | undefined;
  lng?: number | undefined;
}

export interface Login {
  id: string;
  device: Device | undefined;
  location: Location | undefined;
  is_active: boolean;
  created_at: string;
}

export interface GetLoginActivityRequest {
  /** Token from the session cookie (used to determine if the current device is active) */
  token: string;
}

export interface GetLoginActivityResponse {
  recent?: Login | undefined;
  logins: Login[];
}

function createBaseDevice(): Device {
  return { display_name: "", type: 0 };
}

export const Device = {
  encode(message: Device, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.display_name !== "") {
      writer.uint32(10).string(message.display_name);
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Device {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDevice();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.display_name = reader.string();
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

  fromJSON(object: any): Device {
    return {
      display_name: isSet(object.display_name) ? globalThis.String(object.display_name) : "",
      type: isSet(object.type) ? deviceTypeFromJSON(object.type) : 0,
    };
  },

  toJSON(message: Device): unknown {
    const obj: any = {};
    if (message.display_name !== "") {
      obj.display_name = message.display_name;
    }
    if (message.type !== 0) {
      obj.type = deviceTypeToJSON(message.type);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Device>, I>>(base?: I): Device {
    return Device.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Device>, I>>(object: I): Device {
    const message = createBaseDevice();
    message.display_name = object.display_name ?? "";
    message.type = object.type ?? 0;
    return message;
  },
};

function createBaseLocation(): Location {
  return { display_name: "", lat: undefined, lng: undefined };
}

export const Location = {
  encode(message: Location, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.display_name !== "") {
      writer.uint32(10).string(message.display_name);
    }
    if (message.lat !== undefined) {
      writer.uint32(16).sint32(message.lat);
    }
    if (message.lng !== undefined) {
      writer.uint32(24).sint32(message.lng);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Location {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLocation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.display_name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.lat = reader.sint32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.lng = reader.sint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Location {
    return {
      display_name: isSet(object.display_name) ? globalThis.String(object.display_name) : "",
      lat: isSet(object.lat) ? globalThis.Number(object.lat) : undefined,
      lng: isSet(object.lng) ? globalThis.Number(object.lng) : undefined,
    };
  },

  toJSON(message: Location): unknown {
    const obj: any = {};
    if (message.display_name !== "") {
      obj.display_name = message.display_name;
    }
    if (message.lat !== undefined) {
      obj.lat = Math.round(message.lat);
    }
    if (message.lng !== undefined) {
      obj.lng = Math.round(message.lng);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Location>, I>>(base?: I): Location {
    return Location.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Location>, I>>(object: I): Location {
    const message = createBaseLocation();
    message.display_name = object.display_name ?? "";
    message.lat = object.lat ?? undefined;
    message.lng = object.lng ?? undefined;
    return message;
  },
};

function createBaseLogin(): Login {
  return { id: "", device: undefined, location: undefined, is_active: false, created_at: "" };
}

export const Login = {
  encode(message: Login, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.device !== undefined) {
      Device.encode(message.device, writer.uint32(18).fork()).ldelim();
    }
    if (message.location !== undefined) {
      Location.encode(message.location, writer.uint32(26).fork()).ldelim();
    }
    if (message.is_active === true) {
      writer.uint32(32).bool(message.is_active);
    }
    if (message.created_at !== "") {
      writer.uint32(42).string(message.created_at);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Login {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLogin();
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

          message.device = Device.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.location = Location.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.is_active = reader.bool();
          continue;
        case 5:
          if (tag !== 42) {
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

  fromJSON(object: any): Login {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      device: isSet(object.device) ? Device.fromJSON(object.device) : undefined,
      location: isSet(object.location) ? Location.fromJSON(object.location) : undefined,
      is_active: isSet(object.is_active) ? globalThis.Boolean(object.is_active) : false,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
    };
  },

  toJSON(message: Login): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.device !== undefined) {
      obj.device = Device.toJSON(message.device);
    }
    if (message.location !== undefined) {
      obj.location = Location.toJSON(message.location);
    }
    if (message.is_active === true) {
      obj.is_active = message.is_active;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Login>, I>>(base?: I): Login {
    return Login.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Login>, I>>(object: I): Login {
    const message = createBaseLogin();
    message.id = object.id ?? "";
    message.device = (object.device !== undefined && object.device !== null)
      ? Device.fromPartial(object.device)
      : undefined;
    message.location = (object.location !== undefined && object.location !== null)
      ? Location.fromPartial(object.location)
      : undefined;
    message.is_active = object.is_active ?? false;
    message.created_at = object.created_at ?? "";
    return message;
  },
};

function createBaseGetLoginActivityRequest(): GetLoginActivityRequest {
  return { token: "" };
}

export const GetLoginActivityRequest = {
  encode(message: GetLoginActivityRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.token !== "") {
      writer.uint32(10).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetLoginActivityRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetLoginActivityRequest();
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

  fromJSON(object: any): GetLoginActivityRequest {
    return { token: isSet(object.token) ? globalThis.String(object.token) : "" };
  },

  toJSON(message: GetLoginActivityRequest): unknown {
    const obj: any = {};
    if (message.token !== "") {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetLoginActivityRequest>, I>>(base?: I): GetLoginActivityRequest {
    return GetLoginActivityRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetLoginActivityRequest>, I>>(object: I): GetLoginActivityRequest {
    const message = createBaseGetLoginActivityRequest();
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseGetLoginActivityResponse(): GetLoginActivityResponse {
  return { recent: undefined, logins: [] };
}

export const GetLoginActivityResponse = {
  encode(message: GetLoginActivityResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.recent !== undefined) {
      Login.encode(message.recent, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.logins) {
      Login.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetLoginActivityResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetLoginActivityResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.recent = Login.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.logins.push(Login.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetLoginActivityResponse {
    return {
      recent: isSet(object.recent) ? Login.fromJSON(object.recent) : undefined,
      logins: globalThis.Array.isArray(object?.logins) ? object.logins.map((e: any) => Login.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetLoginActivityResponse): unknown {
    const obj: any = {};
    if (message.recent !== undefined) {
      obj.recent = Login.toJSON(message.recent);
    }
    if (message.logins?.length) {
      obj.logins = message.logins.map((e) => Login.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetLoginActivityResponse>, I>>(base?: I): GetLoginActivityResponse {
    return GetLoginActivityResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetLoginActivityResponse>, I>>(object: I): GetLoginActivityResponse {
    const message = createBaseGetLoginActivityResponse();
    message.recent = (object.recent !== undefined && object.recent !== null)
      ? Login.fromPartial(object.recent)
      : undefined;
    message.logins = object.logins?.map((e) => Login.fromPartial(e)) || [];
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
