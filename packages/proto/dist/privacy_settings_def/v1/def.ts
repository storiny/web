/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "privacy_settings_def.v1";

export const IncomingFriendRequest = {
  UNSPECIFIED: 0,
  EVERYONE: 1,
  FOLLOWING: 2,
  FOF: 3,
  NONE: 4,
  UNRECOGNIZED: -1,
} as const;

export type IncomingFriendRequest = typeof IncomingFriendRequest[keyof typeof IncomingFriendRequest];

export function incomingFriendRequestFromJSON(object: any): IncomingFriendRequest {
  switch (object) {
    case 0:
    case "INCOMING_FRIEND_REQUEST_UNSPECIFIED":
      return IncomingFriendRequest.UNSPECIFIED;
    case 1:
    case "INCOMING_FRIEND_REQUEST_EVERYONE":
      return IncomingFriendRequest.EVERYONE;
    case 2:
    case "INCOMING_FRIEND_REQUEST_FOLLOWING":
      return IncomingFriendRequest.FOLLOWING;
    case 3:
    case "INCOMING_FRIEND_REQUEST_FOF":
      return IncomingFriendRequest.FOF;
    case 4:
    case "INCOMING_FRIEND_REQUEST_NONE":
      return IncomingFriendRequest.NONE;
    case -1:
    case "UNRECOGNIZED":
    default:
      return IncomingFriendRequest.UNRECOGNIZED;
  }
}

export function incomingFriendRequestToJSON(object: IncomingFriendRequest): string {
  switch (object) {
    case IncomingFriendRequest.UNSPECIFIED:
      return "INCOMING_FRIEND_REQUEST_UNSPECIFIED";
    case IncomingFriendRequest.EVERYONE:
      return "INCOMING_FRIEND_REQUEST_EVERYONE";
    case IncomingFriendRequest.FOLLOWING:
      return "INCOMING_FRIEND_REQUEST_FOLLOWING";
    case IncomingFriendRequest.FOF:
      return "INCOMING_FRIEND_REQUEST_FOF";
    case IncomingFriendRequest.NONE:
      return "INCOMING_FRIEND_REQUEST_NONE";
    case IncomingFriendRequest.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export const IncomingCollaborationRequest = {
  UNSPECIFIED: 0,
  EVERYONE: 1,
  FOLLOWING: 2,
  FRIENDS: 3,
  NONE: 4,
  UNRECOGNIZED: -1,
} as const;

export type IncomingCollaborationRequest =
  typeof IncomingCollaborationRequest[keyof typeof IncomingCollaborationRequest];

export function incomingCollaborationRequestFromJSON(object: any): IncomingCollaborationRequest {
  switch (object) {
    case 0:
    case "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED":
      return IncomingCollaborationRequest.UNSPECIFIED;
    case 1:
    case "INCOMING_COLLABORATION_REQUEST_EVERYONE":
      return IncomingCollaborationRequest.EVERYONE;
    case 2:
    case "INCOMING_COLLABORATION_REQUEST_FOLLOWING":
      return IncomingCollaborationRequest.FOLLOWING;
    case 3:
    case "INCOMING_COLLABORATION_REQUEST_FRIENDS":
      return IncomingCollaborationRequest.FRIENDS;
    case 4:
    case "INCOMING_COLLABORATION_REQUEST_NONE":
      return IncomingCollaborationRequest.NONE;
    case -1:
    case "UNRECOGNIZED":
    default:
      return IncomingCollaborationRequest.UNRECOGNIZED;
  }
}

export function incomingCollaborationRequestToJSON(object: IncomingCollaborationRequest): string {
  switch (object) {
    case IncomingCollaborationRequest.UNSPECIFIED:
      return "INCOMING_COLLABORATION_REQUEST_UNSPECIFIED";
    case IncomingCollaborationRequest.EVERYONE:
      return "INCOMING_COLLABORATION_REQUEST_EVERYONE";
    case IncomingCollaborationRequest.FOLLOWING:
      return "INCOMING_COLLABORATION_REQUEST_FOLLOWING";
    case IncomingCollaborationRequest.FRIENDS:
      return "INCOMING_COLLABORATION_REQUEST_FRIENDS";
    case IncomingCollaborationRequest.NONE:
      return "INCOMING_COLLABORATION_REQUEST_NONE";
    case IncomingCollaborationRequest.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export const RelationVisibility = { UNSPECIFIED: 0, EVERYONE: 1, FRIENDS: 2, NONE: 3, UNRECOGNIZED: -1 } as const;

export type RelationVisibility = typeof RelationVisibility[keyof typeof RelationVisibility];

export function relationVisibilityFromJSON(object: any): RelationVisibility {
  switch (object) {
    case 0:
    case "RELATION_VISIBILITY_UNSPECIFIED":
      return RelationVisibility.UNSPECIFIED;
    case 1:
    case "RELATION_VISIBILITY_EVERYONE":
      return RelationVisibility.EVERYONE;
    case 2:
    case "RELATION_VISIBILITY_FRIENDS":
      return RelationVisibility.FRIENDS;
    case 3:
    case "RELATION_VISIBILITY_NONE":
      return RelationVisibility.NONE;
    case -1:
    case "UNRECOGNIZED":
    default:
      return RelationVisibility.UNRECOGNIZED;
  }
}

export function relationVisibilityToJSON(object: RelationVisibility): string {
  switch (object) {
    case RelationVisibility.UNSPECIFIED:
      return "RELATION_VISIBILITY_UNSPECIFIED";
    case RelationVisibility.EVERYONE:
      return "RELATION_VISIBILITY_EVERYONE";
    case RelationVisibility.FRIENDS:
      return "RELATION_VISIBILITY_FRIENDS";
    case RelationVisibility.NONE:
      return "RELATION_VISIBILITY_NONE";
    case RelationVisibility.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface GetPrivacySettingsRequest {
  user_id: string;
}

export interface GetPrivacySettingsResponse {
  is_private_account: boolean;
  record_read_history: boolean;
  allow_sensitive_media: boolean;
  incoming_friend_requests: IncomingFriendRequest;
  incoming_collaboration_requests: IncomingCollaborationRequest;
  following_list_visibility: RelationVisibility;
  friend_list_visibility: RelationVisibility;
}

function createBaseGetPrivacySettingsRequest(): GetPrivacySettingsRequest {
  return { user_id: "" };
}

export const GetPrivacySettingsRequest = {
  encode(message: GetPrivacySettingsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetPrivacySettingsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetPrivacySettingsRequest();
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

  fromJSON(object: any): GetPrivacySettingsRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetPrivacySettingsRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetPrivacySettingsRequest>, I>>(base?: I): GetPrivacySettingsRequest {
    return GetPrivacySettingsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetPrivacySettingsRequest>, I>>(object: I): GetPrivacySettingsRequest {
    const message = createBaseGetPrivacySettingsRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetPrivacySettingsResponse(): GetPrivacySettingsResponse {
  return {
    is_private_account: false,
    record_read_history: false,
    allow_sensitive_media: false,
    incoming_friend_requests: 0,
    incoming_collaboration_requests: 0,
    following_list_visibility: 0,
    friend_list_visibility: 0,
  };
}

export const GetPrivacySettingsResponse = {
  encode(message: GetPrivacySettingsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.is_private_account === true) {
      writer.uint32(8).bool(message.is_private_account);
    }
    if (message.record_read_history === true) {
      writer.uint32(16).bool(message.record_read_history);
    }
    if (message.allow_sensitive_media === true) {
      writer.uint32(24).bool(message.allow_sensitive_media);
    }
    if (message.incoming_friend_requests !== 0) {
      writer.uint32(32).int32(message.incoming_friend_requests);
    }
    if (message.incoming_collaboration_requests !== 0) {
      writer.uint32(40).int32(message.incoming_collaboration_requests);
    }
    if (message.following_list_visibility !== 0) {
      writer.uint32(48).int32(message.following_list_visibility);
    }
    if (message.friend_list_visibility !== 0) {
      writer.uint32(56).int32(message.friend_list_visibility);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetPrivacySettingsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetPrivacySettingsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.is_private_account = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.record_read_history = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.allow_sensitive_media = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.incoming_friend_requests = reader.int32() as any;
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.incoming_collaboration_requests = reader.int32() as any;
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.following_list_visibility = reader.int32() as any;
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.friend_list_visibility = reader.int32() as any;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetPrivacySettingsResponse {
    return {
      is_private_account: isSet(object.is_private_account) ? globalThis.Boolean(object.is_private_account) : false,
      record_read_history: isSet(object.record_read_history) ? globalThis.Boolean(object.record_read_history) : false,
      allow_sensitive_media: isSet(object.allow_sensitive_media)
        ? globalThis.Boolean(object.allow_sensitive_media)
        : false,
      incoming_friend_requests: isSet(object.incoming_friend_requests)
        ? incomingFriendRequestFromJSON(object.incoming_friend_requests)
        : 0,
      incoming_collaboration_requests: isSet(object.incoming_collaboration_requests)
        ? incomingCollaborationRequestFromJSON(object.incoming_collaboration_requests)
        : 0,
      following_list_visibility: isSet(object.following_list_visibility)
        ? relationVisibilityFromJSON(object.following_list_visibility)
        : 0,
      friend_list_visibility: isSet(object.friend_list_visibility)
        ? relationVisibilityFromJSON(object.friend_list_visibility)
        : 0,
    };
  },

  toJSON(message: GetPrivacySettingsResponse): unknown {
    const obj: any = {};
    if (message.is_private_account === true) {
      obj.is_private_account = message.is_private_account;
    }
    if (message.record_read_history === true) {
      obj.record_read_history = message.record_read_history;
    }
    if (message.allow_sensitive_media === true) {
      obj.allow_sensitive_media = message.allow_sensitive_media;
    }
    if (message.incoming_friend_requests !== 0) {
      obj.incoming_friend_requests = incomingFriendRequestToJSON(message.incoming_friend_requests);
    }
    if (message.incoming_collaboration_requests !== 0) {
      obj.incoming_collaboration_requests = incomingCollaborationRequestToJSON(message.incoming_collaboration_requests);
    }
    if (message.following_list_visibility !== 0) {
      obj.following_list_visibility = relationVisibilityToJSON(message.following_list_visibility);
    }
    if (message.friend_list_visibility !== 0) {
      obj.friend_list_visibility = relationVisibilityToJSON(message.friend_list_visibility);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetPrivacySettingsResponse>, I>>(base?: I): GetPrivacySettingsResponse {
    return GetPrivacySettingsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetPrivacySettingsResponse>, I>>(object: I): GetPrivacySettingsResponse {
    const message = createBaseGetPrivacySettingsResponse();
    message.is_private_account = object.is_private_account ?? false;
    message.record_read_history = object.record_read_history ?? false;
    message.allow_sensitive_media = object.allow_sensitive_media ?? false;
    message.incoming_friend_requests = object.incoming_friend_requests ?? 0;
    message.incoming_collaboration_requests = object.incoming_collaboration_requests ?? 0;
    message.following_list_visibility = object.following_list_visibility ?? 0;
    message.friend_list_visibility = object.friend_list_visibility ?? 0;
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
