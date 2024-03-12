/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "notification_settings_def.v1";

export interface GetNotificationSettingsRequest {
  user_id: string;
}

export interface GetNotificationSettingsResponse {
  /** Site notifications */
  features_and_updates: boolean;
  stories: boolean;
  story_likes: boolean;
  tags: boolean;
  comments: boolean;
  replies: boolean;
  new_followers: boolean;
  friend_requests: boolean;
  collaboration_requests: boolean;
  blog_requests: boolean;
  /** Mail notifications */
  mail_login_activity: boolean;
  mail_features_and_updates: boolean;
  mail_newsletters: boolean;
  mail_digest: boolean;
}

function createBaseGetNotificationSettingsRequest(): GetNotificationSettingsRequest {
  return { user_id: "" };
}

export const GetNotificationSettingsRequest = {
  encode(message: GetNotificationSettingsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetNotificationSettingsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetNotificationSettingsRequest();
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

  fromJSON(object: any): GetNotificationSettingsRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetNotificationSettingsRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetNotificationSettingsRequest>, I>>(base?: I): GetNotificationSettingsRequest {
    return GetNotificationSettingsRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetNotificationSettingsRequest>, I>>(
    object: I,
  ): GetNotificationSettingsRequest {
    const message = createBaseGetNotificationSettingsRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetNotificationSettingsResponse(): GetNotificationSettingsResponse {
  return {
    features_and_updates: false,
    stories: false,
    story_likes: false,
    tags: false,
    comments: false,
    replies: false,
    new_followers: false,
    friend_requests: false,
    collaboration_requests: false,
    blog_requests: false,
    mail_login_activity: false,
    mail_features_and_updates: false,
    mail_newsletters: false,
    mail_digest: false,
  };
}

export const GetNotificationSettingsResponse = {
  encode(message: GetNotificationSettingsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.features_and_updates === true) {
      writer.uint32(8).bool(message.features_and_updates);
    }
    if (message.stories === true) {
      writer.uint32(16).bool(message.stories);
    }
    if (message.story_likes === true) {
      writer.uint32(24).bool(message.story_likes);
    }
    if (message.tags === true) {
      writer.uint32(32).bool(message.tags);
    }
    if (message.comments === true) {
      writer.uint32(40).bool(message.comments);
    }
    if (message.replies === true) {
      writer.uint32(48).bool(message.replies);
    }
    if (message.new_followers === true) {
      writer.uint32(56).bool(message.new_followers);
    }
    if (message.friend_requests === true) {
      writer.uint32(64).bool(message.friend_requests);
    }
    if (message.collaboration_requests === true) {
      writer.uint32(72).bool(message.collaboration_requests);
    }
    if (message.blog_requests === true) {
      writer.uint32(80).bool(message.blog_requests);
    }
    if (message.mail_login_activity === true) {
      writer.uint32(88).bool(message.mail_login_activity);
    }
    if (message.mail_features_and_updates === true) {
      writer.uint32(96).bool(message.mail_features_and_updates);
    }
    if (message.mail_newsletters === true) {
      writer.uint32(104).bool(message.mail_newsletters);
    }
    if (message.mail_digest === true) {
      writer.uint32(112).bool(message.mail_digest);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetNotificationSettingsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetNotificationSettingsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.features_and_updates = reader.bool();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.stories = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.story_likes = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.tags = reader.bool();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.comments = reader.bool();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.replies = reader.bool();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.new_followers = reader.bool();
          continue;
        case 8:
          if (tag !== 64) {
            break;
          }

          message.friend_requests = reader.bool();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.collaboration_requests = reader.bool();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.blog_requests = reader.bool();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.mail_login_activity = reader.bool();
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.mail_features_and_updates = reader.bool();
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.mail_newsletters = reader.bool();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.mail_digest = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetNotificationSettingsResponse {
    return {
      features_and_updates: isSet(object.features_and_updates)
        ? globalThis.Boolean(object.features_and_updates)
        : false,
      stories: isSet(object.stories) ? globalThis.Boolean(object.stories) : false,
      story_likes: isSet(object.story_likes) ? globalThis.Boolean(object.story_likes) : false,
      tags: isSet(object.tags) ? globalThis.Boolean(object.tags) : false,
      comments: isSet(object.comments) ? globalThis.Boolean(object.comments) : false,
      replies: isSet(object.replies) ? globalThis.Boolean(object.replies) : false,
      new_followers: isSet(object.new_followers) ? globalThis.Boolean(object.new_followers) : false,
      friend_requests: isSet(object.friend_requests) ? globalThis.Boolean(object.friend_requests) : false,
      collaboration_requests: isSet(object.collaboration_requests)
        ? globalThis.Boolean(object.collaboration_requests)
        : false,
      blog_requests: isSet(object.blog_requests) ? globalThis.Boolean(object.blog_requests) : false,
      mail_login_activity: isSet(object.mail_login_activity) ? globalThis.Boolean(object.mail_login_activity) : false,
      mail_features_and_updates: isSet(object.mail_features_and_updates)
        ? globalThis.Boolean(object.mail_features_and_updates)
        : false,
      mail_newsletters: isSet(object.mail_newsletters) ? globalThis.Boolean(object.mail_newsletters) : false,
      mail_digest: isSet(object.mail_digest) ? globalThis.Boolean(object.mail_digest) : false,
    };
  },

  toJSON(message: GetNotificationSettingsResponse): unknown {
    const obj: any = {};
    if (message.features_and_updates === true) {
      obj.features_and_updates = message.features_and_updates;
    }
    if (message.stories === true) {
      obj.stories = message.stories;
    }
    if (message.story_likes === true) {
      obj.story_likes = message.story_likes;
    }
    if (message.tags === true) {
      obj.tags = message.tags;
    }
    if (message.comments === true) {
      obj.comments = message.comments;
    }
    if (message.replies === true) {
      obj.replies = message.replies;
    }
    if (message.new_followers === true) {
      obj.new_followers = message.new_followers;
    }
    if (message.friend_requests === true) {
      obj.friend_requests = message.friend_requests;
    }
    if (message.collaboration_requests === true) {
      obj.collaboration_requests = message.collaboration_requests;
    }
    if (message.blog_requests === true) {
      obj.blog_requests = message.blog_requests;
    }
    if (message.mail_login_activity === true) {
      obj.mail_login_activity = message.mail_login_activity;
    }
    if (message.mail_features_and_updates === true) {
      obj.mail_features_and_updates = message.mail_features_and_updates;
    }
    if (message.mail_newsletters === true) {
      obj.mail_newsletters = message.mail_newsletters;
    }
    if (message.mail_digest === true) {
      obj.mail_digest = message.mail_digest;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetNotificationSettingsResponse>, I>>(base?: I): GetNotificationSettingsResponse {
    return GetNotificationSettingsResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetNotificationSettingsResponse>, I>>(
    object: I,
  ): GetNotificationSettingsResponse {
    const message = createBaseGetNotificationSettingsResponse();
    message.features_and_updates = object.features_and_updates ?? false;
    message.stories = object.stories ?? false;
    message.story_likes = object.story_likes ?? false;
    message.tags = object.tags ?? false;
    message.comments = object.comments ?? false;
    message.replies = object.replies ?? false;
    message.new_followers = object.new_followers ?? false;
    message.friend_requests = object.friend_requests ?? false;
    message.collaboration_requests = object.collaboration_requests ?? false;
    message.blog_requests = object.blog_requests ?? false;
    message.mail_login_activity = object.mail_login_activity ?? false;
    message.mail_features_and_updates = object.mail_features_and_updates ?? false;
    message.mail_newsletters = object.mail_newsletters ?? false;
    message.mail_digest = object.mail_digest ?? false;
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
