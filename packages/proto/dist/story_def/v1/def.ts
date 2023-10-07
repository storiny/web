/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Tag } from "../../tag_def/v1/def";
import { User } from "../../user_def/v1/def";

export const protobufPackage = "story_def.v1";

export const StoryAgeRestriction = { UNSPECIFIED: 0, NOT_RATED: 1, RATED: 2, UNRECOGNIZED: -1 } as const;

export type StoryAgeRestriction = typeof StoryAgeRestriction[keyof typeof StoryAgeRestriction];

export function storyAgeRestrictionFromJSON(object: any): StoryAgeRestriction {
  switch (object) {
    case 0:
    case "STORY_AGE_RESTRICTION_UNSPECIFIED":
      return StoryAgeRestriction.UNSPECIFIED;
    case 1:
    case "STORY_AGE_RESTRICTION_NOT_RATED":
      return StoryAgeRestriction.NOT_RATED;
    case 2:
    case "STORY_AGE_RESTRICTION_RATED":
      return StoryAgeRestriction.RATED;
    case -1:
    case "UNRECOGNIZED":
    default:
      return StoryAgeRestriction.UNRECOGNIZED;
  }
}

export function storyAgeRestrictionToJSON(object: StoryAgeRestriction): string {
  switch (object) {
    case StoryAgeRestriction.UNSPECIFIED:
      return "STORY_AGE_RESTRICTION_UNSPECIFIED";
    case StoryAgeRestriction.NOT_RATED:
      return "STORY_AGE_RESTRICTION_NOT_RATED";
    case StoryAgeRestriction.RATED:
      return "STORY_AGE_RESTRICTION_RATED";
    case StoryAgeRestriction.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export const StoryVisibility = { UNSPECIFIED: 0, UNLISTED: 1, PUBLIC: 2, UNRECOGNIZED: -1 } as const;

export type StoryVisibility = typeof StoryVisibility[keyof typeof StoryVisibility];

export function storyVisibilityFromJSON(object: any): StoryVisibility {
  switch (object) {
    case 0:
    case "STORY_VISIBILITY_UNSPECIFIED":
      return StoryVisibility.UNSPECIFIED;
    case 1:
    case "STORY_VISIBILITY_UNLISTED":
      return StoryVisibility.UNLISTED;
    case 2:
    case "STORY_VISIBILITY_PUBLIC":
      return StoryVisibility.PUBLIC;
    case -1:
    case "UNRECOGNIZED":
    default:
      return StoryVisibility.UNRECOGNIZED;
  }
}

export function storyVisibilityToJSON(object: StoryVisibility): string {
  switch (object) {
    case StoryVisibility.UNSPECIFIED:
      return "STORY_VISIBILITY_UNSPECIFIED";
    case StoryVisibility.UNLISTED:
      return "STORY_VISIBILITY_UNLISTED";
    case StoryVisibility.PUBLIC:
      return "STORY_VISIBILITY_PUBLIC";
    case StoryVisibility.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export const StoryLicense = {
  UNSPECIFIED: 0,
  RESERVED: 1,
  CC_ZERO: 2,
  CC_BY: 3,
  CC_BY_SA: 4,
  CC_BY_ND: 5,
  CC_BY_NC: 6,
  CC_BY_NC_SA: 7,
  CC_BY_NC_ND: 8,
  UNRECOGNIZED: -1,
} as const;

export type StoryLicense = typeof StoryLicense[keyof typeof StoryLicense];

export function storyLicenseFromJSON(object: any): StoryLicense {
  switch (object) {
    case 0:
    case "STORY_LICENSE_UNSPECIFIED":
      return StoryLicense.UNSPECIFIED;
    case 1:
    case "STORY_LICENSE_RESERVED":
      return StoryLicense.RESERVED;
    case 2:
    case "STORY_LICENSE_CC_ZERO":
      return StoryLicense.CC_ZERO;
    case 3:
    case "STORY_LICENSE_CC_BY":
      return StoryLicense.CC_BY;
    case 4:
    case "STORY_LICENSE_CC_BY_SA":
      return StoryLicense.CC_BY_SA;
    case 5:
    case "STORY_LICENSE_CC_BY_ND":
      return StoryLicense.CC_BY_ND;
    case 6:
    case "STORY_LICENSE_CC_BY_NC":
      return StoryLicense.CC_BY_NC;
    case 7:
    case "STORY_LICENSE_CC_BY_NC_SA":
      return StoryLicense.CC_BY_NC_SA;
    case 8:
    case "STORY_LICENSE_CC_BY_NC_ND":
      return StoryLicense.CC_BY_NC_ND;
    case -1:
    case "UNRECOGNIZED":
    default:
      return StoryLicense.UNRECOGNIZED;
  }
}

export function storyLicenseToJSON(object: StoryLicense): string {
  switch (object) {
    case StoryLicense.UNSPECIFIED:
      return "STORY_LICENSE_UNSPECIFIED";
    case StoryLicense.RESERVED:
      return "STORY_LICENSE_RESERVED";
    case StoryLicense.CC_ZERO:
      return "STORY_LICENSE_CC_ZERO";
    case StoryLicense.CC_BY:
      return "STORY_LICENSE_CC_BY";
    case StoryLicense.CC_BY_SA:
      return "STORY_LICENSE_CC_BY_SA";
    case StoryLicense.CC_BY_ND:
      return "STORY_LICENSE_CC_BY_ND";
    case StoryLicense.CC_BY_NC:
      return "STORY_LICENSE_CC_BY_NC";
    case StoryLicense.CC_BY_NC_SA:
      return "STORY_LICENSE_CC_BY_NC_SA";
    case StoryLicense.CC_BY_NC_ND:
      return "STORY_LICENSE_CC_BY_NC_ND";
    case StoryLicense.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Draft {
  id: string;
  title: string;
  splash_id?: string | undefined;
  splash_hex?: string | undefined;
  word_count: number;
  created_at: string;
  edited_at?: string | undefined;
  published_at?: string | undefined;
}

export interface GetDraftsInfoRequest {
  id: string;
}

export interface GetDraftsInfoResponse {
  pending_draft_count: number;
  deleted_draft_count: number;
  latest_draft?: Draft | undefined;
}

export interface GetStoriesInfoRequest {
  id: string;
}

export interface GetStoriesInfoResponse {
  published_story_count: number;
  deleted_story_count: number;
}

export interface GetStoryRequest {
  id_or_slug: string;
  token?: string | undefined;
}

export interface GetStoryResponse {
  id: string;
  title: string;
  slug?: string | undefined;
  description?: string | undefined;
  splash_id?: string | undefined;
  splash_hex?: string | undefined;
  doc_key: string;
  category: string;
  user_id: string;
  like_count: number;
  read_count: number;
  word_count: number;
  comment_count: number;
  age_restriction: StoryAgeRestriction;
  license: StoryLicense;
  visibility: StoryVisibility;
  /** SEO */
  canonical_url?: string | undefined;
  seo_description?: string | undefined;
  seo_title?: string | undefined;
  preview_image?: string | undefined;
  created_at: string;
  edited_at?: string | undefined;
  published_at?: string | undefined;
  first_published_at?: string | undefined;
  deleted_at?: string | undefined;
  user:
    | User
    | undefined;
  /** User specific props */
  is_bookmarked: boolean;
  is_liked: boolean;
  disable_comments: boolean;
  disable_public_revision_history: boolean;
  disable_toc: boolean;
  tags: Tag[];
}

function createBaseDraft(): Draft {
  return {
    id: "",
    title: "",
    splash_id: undefined,
    splash_hex: undefined,
    word_count: 0,
    created_at: "",
    edited_at: undefined,
    published_at: undefined,
  };
}

export const Draft = {
  encode(message: Draft, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.title !== "") {
      writer.uint32(18).string(message.title);
    }
    if (message.splash_id !== undefined) {
      writer.uint32(42).string(message.splash_id);
    }
    if (message.splash_hex !== undefined) {
      writer.uint32(50).string(message.splash_hex);
    }
    if (message.word_count !== 0) {
      writer.uint32(72).uint32(message.word_count);
    }
    if (message.created_at !== "") {
      writer.uint32(82).string(message.created_at);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(90).string(message.edited_at);
    }
    if (message.published_at !== undefined) {
      writer.uint32(98).string(message.published_at);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Draft {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDraft();
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

          message.title = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.splash_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.splash_hex = reader.string();
          continue;
        case 9:
          if (tag !== 72) {
            break;
          }

          message.word_count = reader.uint32();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.edited_at = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.published_at = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Draft {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      title: isSet(object.title) ? globalThis.String(object.title) : "",
      splash_id: isSet(object.splash_id) ? globalThis.String(object.splash_id) : undefined,
      splash_hex: isSet(object.splash_hex) ? globalThis.String(object.splash_hex) : undefined,
      word_count: isSet(object.word_count) ? globalThis.Number(object.word_count) : 0,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      edited_at: isSet(object.edited_at) ? globalThis.String(object.edited_at) : undefined,
      published_at: isSet(object.published_at) ? globalThis.String(object.published_at) : undefined,
    };
  },

  toJSON(message: Draft): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.title !== "") {
      obj.title = message.title;
    }
    if (message.splash_id !== undefined) {
      obj.splash_id = message.splash_id;
    }
    if (message.splash_hex !== undefined) {
      obj.splash_hex = message.splash_hex;
    }
    if (message.word_count !== 0) {
      obj.word_count = Math.round(message.word_count);
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.edited_at !== undefined) {
      obj.edited_at = message.edited_at;
    }
    if (message.published_at !== undefined) {
      obj.published_at = message.published_at;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Draft>, I>>(base?: I): Draft {
    return Draft.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Draft>, I>>(object: I): Draft {
    const message = createBaseDraft();
    message.id = object.id ?? "";
    message.title = object.title ?? "";
    message.splash_id = object.splash_id ?? undefined;
    message.splash_hex = object.splash_hex ?? undefined;
    message.word_count = object.word_count ?? 0;
    message.created_at = object.created_at ?? "";
    message.edited_at = object.edited_at ?? undefined;
    message.published_at = object.published_at ?? undefined;
    return message;
  },
};

function createBaseGetDraftsInfoRequest(): GetDraftsInfoRequest {
  return { id: "" };
}

export const GetDraftsInfoRequest = {
  encode(message: GetDraftsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetDraftsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDraftsInfoRequest();
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

  fromJSON(object: any): GetDraftsInfoRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetDraftsInfoRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(base?: I): GetDraftsInfoRequest {
    return GetDraftsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(object: I): GetDraftsInfoRequest {
    const message = createBaseGetDraftsInfoRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetDraftsInfoResponse(): GetDraftsInfoResponse {
  return { pending_draft_count: 0, deleted_draft_count: 0, latest_draft: undefined };
}

export const GetDraftsInfoResponse = {
  encode(message: GetDraftsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pending_draft_count !== 0) {
      writer.uint32(8).uint32(message.pending_draft_count);
    }
    if (message.deleted_draft_count !== 0) {
      writer.uint32(16).uint32(message.deleted_draft_count);
    }
    if (message.latest_draft !== undefined) {
      Draft.encode(message.latest_draft, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetDraftsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDraftsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.pending_draft_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.deleted_draft_count = reader.uint32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.latest_draft = Draft.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetDraftsInfoResponse {
    return {
      pending_draft_count: isSet(object.pending_draft_count) ? globalThis.Number(object.pending_draft_count) : 0,
      deleted_draft_count: isSet(object.deleted_draft_count) ? globalThis.Number(object.deleted_draft_count) : 0,
      latest_draft: isSet(object.latest_draft) ? Draft.fromJSON(object.latest_draft) : undefined,
    };
  },

  toJSON(message: GetDraftsInfoResponse): unknown {
    const obj: any = {};
    if (message.pending_draft_count !== 0) {
      obj.pending_draft_count = Math.round(message.pending_draft_count);
    }
    if (message.deleted_draft_count !== 0) {
      obj.deleted_draft_count = Math.round(message.deleted_draft_count);
    }
    if (message.latest_draft !== undefined) {
      obj.latest_draft = Draft.toJSON(message.latest_draft);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetDraftsInfoResponse>, I>>(base?: I): GetDraftsInfoResponse {
    return GetDraftsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetDraftsInfoResponse>, I>>(object: I): GetDraftsInfoResponse {
    const message = createBaseGetDraftsInfoResponse();
    message.pending_draft_count = object.pending_draft_count ?? 0;
    message.deleted_draft_count = object.deleted_draft_count ?? 0;
    message.latest_draft = (object.latest_draft !== undefined && object.latest_draft !== null)
      ? Draft.fromPartial(object.latest_draft)
      : undefined;
    return message;
  },
};

function createBaseGetStoriesInfoRequest(): GetStoriesInfoRequest {
  return { id: "" };
}

export const GetStoriesInfoRequest = {
  encode(message: GetStoriesInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoriesInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoriesInfoRequest();
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

  fromJSON(object: any): GetStoriesInfoRequest {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: GetStoriesInfoRequest): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoriesInfoRequest>, I>>(base?: I): GetStoriesInfoRequest {
    return GetStoriesInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoriesInfoRequest>, I>>(object: I): GetStoriesInfoRequest {
    const message = createBaseGetStoriesInfoRequest();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseGetStoriesInfoResponse(): GetStoriesInfoResponse {
  return { published_story_count: 0, deleted_story_count: 0 };
}

export const GetStoriesInfoResponse = {
  encode(message: GetStoriesInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.published_story_count !== 0) {
      writer.uint32(8).uint32(message.published_story_count);
    }
    if (message.deleted_story_count !== 0) {
      writer.uint32(16).uint32(message.deleted_story_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoriesInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoriesInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.published_story_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.deleted_story_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetStoriesInfoResponse {
    return {
      published_story_count: isSet(object.published_story_count) ? globalThis.Number(object.published_story_count) : 0,
      deleted_story_count: isSet(object.deleted_story_count) ? globalThis.Number(object.deleted_story_count) : 0,
    };
  },

  toJSON(message: GetStoriesInfoResponse): unknown {
    const obj: any = {};
    if (message.published_story_count !== 0) {
      obj.published_story_count = Math.round(message.published_story_count);
    }
    if (message.deleted_story_count !== 0) {
      obj.deleted_story_count = Math.round(message.deleted_story_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoriesInfoResponse>, I>>(base?: I): GetStoriesInfoResponse {
    return GetStoriesInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoriesInfoResponse>, I>>(object: I): GetStoriesInfoResponse {
    const message = createBaseGetStoriesInfoResponse();
    message.published_story_count = object.published_story_count ?? 0;
    message.deleted_story_count = object.deleted_story_count ?? 0;
    return message;
  },
};

function createBaseGetStoryRequest(): GetStoryRequest {
  return { id_or_slug: "", token: undefined };
}

export const GetStoryRequest = {
  encode(message: GetStoryRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id_or_slug !== "") {
      writer.uint32(10).string(message.id_or_slug);
    }
    if (message.token !== undefined) {
      writer.uint32(18).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id_or_slug = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
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

  fromJSON(object: any): GetStoryRequest {
    return {
      id_or_slug: isSet(object.id_or_slug) ? globalThis.String(object.id_or_slug) : "",
      token: isSet(object.token) ? globalThis.String(object.token) : undefined,
    };
  },

  toJSON(message: GetStoryRequest): unknown {
    const obj: any = {};
    if (message.id_or_slug !== "") {
      obj.id_or_slug = message.id_or_slug;
    }
    if (message.token !== undefined) {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryRequest>, I>>(base?: I): GetStoryRequest {
    return GetStoryRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryRequest>, I>>(object: I): GetStoryRequest {
    const message = createBaseGetStoryRequest();
    message.id_or_slug = object.id_or_slug ?? "";
    message.token = object.token ?? undefined;
    return message;
  },
};

function createBaseGetStoryResponse(): GetStoryResponse {
  return {
    id: "",
    title: "",
    slug: undefined,
    description: undefined,
    splash_id: undefined,
    splash_hex: undefined,
    doc_key: "",
    category: "",
    user_id: "",
    like_count: 0,
    read_count: 0,
    word_count: 0,
    comment_count: 0,
    age_restriction: 0,
    license: 0,
    visibility: 0,
    canonical_url: undefined,
    seo_description: undefined,
    seo_title: undefined,
    preview_image: undefined,
    created_at: "",
    edited_at: undefined,
    published_at: undefined,
    first_published_at: undefined,
    deleted_at: undefined,
    user: undefined,
    is_bookmarked: false,
    is_liked: false,
    disable_comments: false,
    disable_public_revision_history: false,
    disable_toc: false,
    tags: [],
  };
}

export const GetStoryResponse = {
  encode(message: GetStoryResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.title !== "") {
      writer.uint32(18).string(message.title);
    }
    if (message.slug !== undefined) {
      writer.uint32(26).string(message.slug);
    }
    if (message.description !== undefined) {
      writer.uint32(34).string(message.description);
    }
    if (message.splash_id !== undefined) {
      writer.uint32(42).string(message.splash_id);
    }
    if (message.splash_hex !== undefined) {
      writer.uint32(50).string(message.splash_hex);
    }
    if (message.doc_key !== "") {
      writer.uint32(58).string(message.doc_key);
    }
    if (message.category !== "") {
      writer.uint32(66).string(message.category);
    }
    if (message.user_id !== "") {
      writer.uint32(74).string(message.user_id);
    }
    if (message.like_count !== 0) {
      writer.uint32(80).uint64(message.like_count);
    }
    if (message.read_count !== 0) {
      writer.uint32(88).uint64(message.read_count);
    }
    if (message.word_count !== 0) {
      writer.uint32(96).uint32(message.word_count);
    }
    if (message.comment_count !== 0) {
      writer.uint32(104).uint32(message.comment_count);
    }
    if (message.age_restriction !== 0) {
      writer.uint32(112).int32(message.age_restriction);
    }
    if (message.license !== 0) {
      writer.uint32(120).int32(message.license);
    }
    if (message.visibility !== 0) {
      writer.uint32(128).int32(message.visibility);
    }
    if (message.canonical_url !== undefined) {
      writer.uint32(138).string(message.canonical_url);
    }
    if (message.seo_description !== undefined) {
      writer.uint32(146).string(message.seo_description);
    }
    if (message.seo_title !== undefined) {
      writer.uint32(154).string(message.seo_title);
    }
    if (message.preview_image !== undefined) {
      writer.uint32(162).string(message.preview_image);
    }
    if (message.created_at !== "") {
      writer.uint32(170).string(message.created_at);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(178).string(message.edited_at);
    }
    if (message.published_at !== undefined) {
      writer.uint32(186).string(message.published_at);
    }
    if (message.first_published_at !== undefined) {
      writer.uint32(194).string(message.first_published_at);
    }
    if (message.deleted_at !== undefined) {
      writer.uint32(202).string(message.deleted_at);
    }
    if (message.user !== undefined) {
      User.encode(message.user, writer.uint32(210).fork()).ldelim();
    }
    if (message.is_bookmarked === true) {
      writer.uint32(216).bool(message.is_bookmarked);
    }
    if (message.is_liked === true) {
      writer.uint32(224).bool(message.is_liked);
    }
    if (message.disable_comments === true) {
      writer.uint32(232).bool(message.disable_comments);
    }
    if (message.disable_public_revision_history === true) {
      writer.uint32(240).bool(message.disable_public_revision_history);
    }
    if (message.disable_toc === true) {
      writer.uint32(248).bool(message.disable_toc);
    }
    for (const v of message.tags) {
      Tag.encode(v!, writer.uint32(258).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryResponse();
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

          message.title = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.slug = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.description = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.splash_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.splash_hex = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.doc_key = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.category = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 10:
          if (tag !== 80) {
            break;
          }

          message.like_count = longToNumber(reader.uint64() as Long);
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.read_count = longToNumber(reader.uint64() as Long);
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.word_count = reader.uint32();
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.comment_count = reader.uint32();
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.age_restriction = reader.int32() as any;
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.license = reader.int32() as any;
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.visibility = reader.int32() as any;
          continue;
        case 17:
          if (tag !== 138) {
            break;
          }

          message.canonical_url = reader.string();
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.seo_description = reader.string();
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.seo_title = reader.string();
          continue;
        case 20:
          if (tag !== 162) {
            break;
          }

          message.preview_image = reader.string();
          continue;
        case 21:
          if (tag !== 170) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          message.edited_at = reader.string();
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          message.published_at = reader.string();
          continue;
        case 24:
          if (tag !== 194) {
            break;
          }

          message.first_published_at = reader.string();
          continue;
        case 25:
          if (tag !== 202) {
            break;
          }

          message.deleted_at = reader.string();
          continue;
        case 26:
          if (tag !== 210) {
            break;
          }

          message.user = User.decode(reader, reader.uint32());
          continue;
        case 27:
          if (tag !== 216) {
            break;
          }

          message.is_bookmarked = reader.bool();
          continue;
        case 28:
          if (tag !== 224) {
            break;
          }

          message.is_liked = reader.bool();
          continue;
        case 29:
          if (tag !== 232) {
            break;
          }

          message.disable_comments = reader.bool();
          continue;
        case 30:
          if (tag !== 240) {
            break;
          }

          message.disable_public_revision_history = reader.bool();
          continue;
        case 31:
          if (tag !== 248) {
            break;
          }

          message.disable_toc = reader.bool();
          continue;
        case 32:
          if (tag !== 258) {
            break;
          }

          message.tags.push(Tag.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetStoryResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      title: isSet(object.title) ? globalThis.String(object.title) : "",
      slug: isSet(object.slug) ? globalThis.String(object.slug) : undefined,
      description: isSet(object.description) ? globalThis.String(object.description) : undefined,
      splash_id: isSet(object.splash_id) ? globalThis.String(object.splash_id) : undefined,
      splash_hex: isSet(object.splash_hex) ? globalThis.String(object.splash_hex) : undefined,
      doc_key: isSet(object.doc_key) ? globalThis.String(object.doc_key) : "",
      category: isSet(object.category) ? globalThis.String(object.category) : "",
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
      like_count: isSet(object.like_count) ? globalThis.Number(object.like_count) : 0,
      read_count: isSet(object.read_count) ? globalThis.Number(object.read_count) : 0,
      word_count: isSet(object.word_count) ? globalThis.Number(object.word_count) : 0,
      comment_count: isSet(object.comment_count) ? globalThis.Number(object.comment_count) : 0,
      age_restriction: isSet(object.age_restriction) ? storyAgeRestrictionFromJSON(object.age_restriction) : 0,
      license: isSet(object.license) ? storyLicenseFromJSON(object.license) : 0,
      visibility: isSet(object.visibility) ? storyVisibilityFromJSON(object.visibility) : 0,
      canonical_url: isSet(object.canonical_url) ? globalThis.String(object.canonical_url) : undefined,
      seo_description: isSet(object.seo_description) ? globalThis.String(object.seo_description) : undefined,
      seo_title: isSet(object.seo_title) ? globalThis.String(object.seo_title) : undefined,
      preview_image: isSet(object.preview_image) ? globalThis.String(object.preview_image) : undefined,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      edited_at: isSet(object.edited_at) ? globalThis.String(object.edited_at) : undefined,
      published_at: isSet(object.published_at) ? globalThis.String(object.published_at) : undefined,
      first_published_at: isSet(object.first_published_at) ? globalThis.String(object.first_published_at) : undefined,
      deleted_at: isSet(object.deleted_at) ? globalThis.String(object.deleted_at) : undefined,
      user: isSet(object.user) ? User.fromJSON(object.user) : undefined,
      is_bookmarked: isSet(object.is_bookmarked) ? globalThis.Boolean(object.is_bookmarked) : false,
      is_liked: isSet(object.is_liked) ? globalThis.Boolean(object.is_liked) : false,
      disable_comments: isSet(object.disable_comments) ? globalThis.Boolean(object.disable_comments) : false,
      disable_public_revision_history: isSet(object.disable_public_revision_history)
        ? globalThis.Boolean(object.disable_public_revision_history)
        : false,
      disable_toc: isSet(object.disable_toc) ? globalThis.Boolean(object.disable_toc) : false,
      tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e: any) => Tag.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetStoryResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.title !== "") {
      obj.title = message.title;
    }
    if (message.slug !== undefined) {
      obj.slug = message.slug;
    }
    if (message.description !== undefined) {
      obj.description = message.description;
    }
    if (message.splash_id !== undefined) {
      obj.splash_id = message.splash_id;
    }
    if (message.splash_hex !== undefined) {
      obj.splash_hex = message.splash_hex;
    }
    if (message.doc_key !== "") {
      obj.doc_key = message.doc_key;
    }
    if (message.category !== "") {
      obj.category = message.category;
    }
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    if (message.like_count !== 0) {
      obj.like_count = Math.round(message.like_count);
    }
    if (message.read_count !== 0) {
      obj.read_count = Math.round(message.read_count);
    }
    if (message.word_count !== 0) {
      obj.word_count = Math.round(message.word_count);
    }
    if (message.comment_count !== 0) {
      obj.comment_count = Math.round(message.comment_count);
    }
    if (message.age_restriction !== 0) {
      obj.age_restriction = storyAgeRestrictionToJSON(message.age_restriction);
    }
    if (message.license !== 0) {
      obj.license = storyLicenseToJSON(message.license);
    }
    if (message.visibility !== 0) {
      obj.visibility = storyVisibilityToJSON(message.visibility);
    }
    if (message.canonical_url !== undefined) {
      obj.canonical_url = message.canonical_url;
    }
    if (message.seo_description !== undefined) {
      obj.seo_description = message.seo_description;
    }
    if (message.seo_title !== undefined) {
      obj.seo_title = message.seo_title;
    }
    if (message.preview_image !== undefined) {
      obj.preview_image = message.preview_image;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.edited_at !== undefined) {
      obj.edited_at = message.edited_at;
    }
    if (message.published_at !== undefined) {
      obj.published_at = message.published_at;
    }
    if (message.first_published_at !== undefined) {
      obj.first_published_at = message.first_published_at;
    }
    if (message.deleted_at !== undefined) {
      obj.deleted_at = message.deleted_at;
    }
    if (message.user !== undefined) {
      obj.user = User.toJSON(message.user);
    }
    if (message.is_bookmarked === true) {
      obj.is_bookmarked = message.is_bookmarked;
    }
    if (message.is_liked === true) {
      obj.is_liked = message.is_liked;
    }
    if (message.disable_comments === true) {
      obj.disable_comments = message.disable_comments;
    }
    if (message.disable_public_revision_history === true) {
      obj.disable_public_revision_history = message.disable_public_revision_history;
    }
    if (message.disable_toc === true) {
      obj.disable_toc = message.disable_toc;
    }
    if (message.tags?.length) {
      obj.tags = message.tags.map((e) => Tag.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryResponse>, I>>(base?: I): GetStoryResponse {
    return GetStoryResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryResponse>, I>>(object: I): GetStoryResponse {
    const message = createBaseGetStoryResponse();
    message.id = object.id ?? "";
    message.title = object.title ?? "";
    message.slug = object.slug ?? undefined;
    message.description = object.description ?? undefined;
    message.splash_id = object.splash_id ?? undefined;
    message.splash_hex = object.splash_hex ?? undefined;
    message.doc_key = object.doc_key ?? "";
    message.category = object.category ?? "";
    message.user_id = object.user_id ?? "";
    message.like_count = object.like_count ?? 0;
    message.read_count = object.read_count ?? 0;
    message.word_count = object.word_count ?? 0;
    message.comment_count = object.comment_count ?? 0;
    message.age_restriction = object.age_restriction ?? 0;
    message.license = object.license ?? 0;
    message.visibility = object.visibility ?? 0;
    message.canonical_url = object.canonical_url ?? undefined;
    message.seo_description = object.seo_description ?? undefined;
    message.seo_title = object.seo_title ?? undefined;
    message.preview_image = object.preview_image ?? undefined;
    message.created_at = object.created_at ?? "";
    message.edited_at = object.edited_at ?? undefined;
    message.published_at = object.published_at ?? undefined;
    message.first_published_at = object.first_published_at ?? undefined;
    message.deleted_at = object.deleted_at ?? undefined;
    message.user = (object.user !== undefined && object.user !== null) ? User.fromPartial(object.user) : undefined;
    message.is_bookmarked = object.is_bookmarked ?? false;
    message.is_liked = object.is_liked ?? false;
    message.disable_comments = object.disable_comments ?? false;
    message.disable_public_revision_history = object.disable_public_revision_history ?? false;
    message.disable_toc = object.disable_toc ?? false;
    message.tags = object.tags?.map((e) => Tag.fromPartial(e)) || [];
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

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
