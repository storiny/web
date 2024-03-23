/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { BareBlog } from "../../blog_def/v1/def";
import { Tag } from "../../tag_def/v1/def";
import { BareUser, ExtendedUser } from "../../user_def/v1/def";

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
}

export interface ValidateStoryRequest {
  user_id: string;
  story_id: string;
}

export interface ValidateStoryResponse {
}

export interface CreateDraftRequest {
  user_id: string;
}

export interface CreateDraftResponse {
  draft_id: string;
}

export interface GetDraftsInfoRequest {
  user_id: string;
}

export interface GetDraftsInfoResponse {
  pending_draft_count: number;
  deleted_draft_count: number;
  latest_draft?: Draft | undefined;
}

export interface GetStoriesInfoRequest {
  user_id: string;
}

export interface GetStoriesInfoResponse {
  published_story_count: number;
  deleted_story_count: number;
}

export interface GetContributionsInfoRequest {
  user_id: string;
}

export interface GetContributionsInfoResponse {
  contributable_story_count: number;
  pending_collaboration_request_count: number;
}

export interface GetStoryRequest {
  id_or_slug: string;
  current_user_id?: string | undefined;
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
  /** Replace `uint32` with `uint64` when the read count overflows. */
  like_count: number;
  read_count: number;
  word_count: number;
  comment_count: number;
  age_restriction: StoryAgeRestriction;
  license: StoryLicense;
  visibility: StoryVisibility;
  disable_comments: boolean;
  disable_public_revision_history: boolean;
  disable_toc: boolean;
  /** SEO */
  canonical_url?: string | undefined;
  seo_description?: string | undefined;
  seo_title?: string | undefined;
  preview_image?: string | undefined;
  created_at: string;
  edited_at?: string | undefined;
  published_at?: string | undefined;
  first_published_at?: string | undefined;
  deleted_at?:
    | string
    | undefined;
  /** Joins */
  user: ExtendedUser | undefined;
  contributors: BareUser[];
  tags: Tag[];
  blog?:
    | BareBlog
    | undefined;
  /** User specific props */
  is_bookmarked: boolean;
  is_liked: boolean;
  /** Reading session token */
  reading_session_token: string;
}

export interface GetStoryMetadataRequest {
  id_or_slug: string;
  user_id: string;
}

export interface GetStoryMetadataResponse {
  id: string;
  title: string;
  slug?: string | undefined;
  description?: string | undefined;
  splash_id?: string | undefined;
  splash_hex?: string | undefined;
  doc_key: string;
  category: string;
  user_id: string;
  role: string;
  age_restriction: StoryAgeRestriction;
  license: StoryLicense;
  visibility: StoryVisibility;
  disable_comments: boolean;
  disable_public_revision_history: boolean;
  disable_toc: boolean;
  /** SEO */
  canonical_url?: string | undefined;
  seo_description?: string | undefined;
  seo_title?: string | undefined;
  preview_image?: string | undefined;
  created_at: string;
  edited_at?: string | undefined;
  published_at?: string | undefined;
  first_published_at?: string | undefined;
  deleted_at?:
    | string
    | undefined;
  /** Joins */
  user: BareUser | undefined;
  blog?: BareBlog | undefined;
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
      writer.uint32(26).string(message.splash_id);
    }
    if (message.splash_hex !== undefined) {
      writer.uint32(34).string(message.splash_hex);
    }
    if (message.word_count !== 0) {
      writer.uint32(40).uint32(message.word_count);
    }
    if (message.created_at !== "") {
      writer.uint32(50).string(message.created_at);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(58).string(message.edited_at);
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
        case 3:
          if (tag !== 26) {
            break;
          }

          message.splash_id = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.splash_hex = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.word_count = reader.uint32();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.edited_at = reader.string();
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
    return message;
  },
};

function createBaseValidateStoryRequest(): ValidateStoryRequest {
  return { user_id: "", story_id: "" };
}

export const ValidateStoryRequest = {
  encode(message: ValidateStoryRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    if (message.story_id !== "") {
      writer.uint32(18).string(message.story_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidateStoryRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidateStoryRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.story_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ValidateStoryRequest {
    return {
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
      story_id: isSet(object.story_id) ? globalThis.String(object.story_id) : "",
    };
  },

  toJSON(message: ValidateStoryRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    if (message.story_id !== "") {
      obj.story_id = message.story_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidateStoryRequest>, I>>(base?: I): ValidateStoryRequest {
    return ValidateStoryRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ValidateStoryRequest>, I>>(object: I): ValidateStoryRequest {
    const message = createBaseValidateStoryRequest();
    message.user_id = object.user_id ?? "";
    message.story_id = object.story_id ?? "";
    return message;
  },
};

function createBaseValidateStoryResponse(): ValidateStoryResponse {
  return {};
}

export const ValidateStoryResponse = {
  encode(_: ValidateStoryResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidateStoryResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidateStoryResponse();
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

  fromJSON(_: any): ValidateStoryResponse {
    return {};
  },

  toJSON(_: ValidateStoryResponse): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidateStoryResponse>, I>>(base?: I): ValidateStoryResponse {
    return ValidateStoryResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ValidateStoryResponse>, I>>(_: I): ValidateStoryResponse {
    const message = createBaseValidateStoryResponse();
    return message;
  },
};

function createBaseCreateDraftRequest(): CreateDraftRequest {
  return { user_id: "" };
}

export const CreateDraftRequest = {
  encode(message: CreateDraftRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateDraftRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateDraftRequest();
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

  fromJSON(object: any): CreateDraftRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: CreateDraftRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<CreateDraftRequest>, I>>(base?: I): CreateDraftRequest {
    return CreateDraftRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<CreateDraftRequest>, I>>(object: I): CreateDraftRequest {
    const message = createBaseCreateDraftRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseCreateDraftResponse(): CreateDraftResponse {
  return { draft_id: "" };
}

export const CreateDraftResponse = {
  encode(message: CreateDraftResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.draft_id !== "") {
      writer.uint32(10).string(message.draft_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CreateDraftResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCreateDraftResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.draft_id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CreateDraftResponse {
    return { draft_id: isSet(object.draft_id) ? globalThis.String(object.draft_id) : "" };
  },

  toJSON(message: CreateDraftResponse): unknown {
    const obj: any = {};
    if (message.draft_id !== "") {
      obj.draft_id = message.draft_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<CreateDraftResponse>, I>>(base?: I): CreateDraftResponse {
    return CreateDraftResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<CreateDraftResponse>, I>>(object: I): CreateDraftResponse {
    const message = createBaseCreateDraftResponse();
    message.draft_id = object.draft_id ?? "";
    return message;
  },
};

function createBaseGetDraftsInfoRequest(): GetDraftsInfoRequest {
  return { user_id: "" };
}

export const GetDraftsInfoRequest = {
  encode(message: GetDraftsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
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

  fromJSON(object: any): GetDraftsInfoRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetDraftsInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(base?: I): GetDraftsInfoRequest {
    return GetDraftsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetDraftsInfoRequest>, I>>(object: I): GetDraftsInfoRequest {
    const message = createBaseGetDraftsInfoRequest();
    message.user_id = object.user_id ?? "";
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
  return { user_id: "" };
}

export const GetStoriesInfoRequest = {
  encode(message: GetStoriesInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
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

  fromJSON(object: any): GetStoriesInfoRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetStoriesInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoriesInfoRequest>, I>>(base?: I): GetStoriesInfoRequest {
    return GetStoriesInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoriesInfoRequest>, I>>(object: I): GetStoriesInfoRequest {
    const message = createBaseGetStoriesInfoRequest();
    message.user_id = object.user_id ?? "";
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

function createBaseGetContributionsInfoRequest(): GetContributionsInfoRequest {
  return { user_id: "" };
}

export const GetContributionsInfoRequest = {
  encode(message: GetContributionsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetContributionsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetContributionsInfoRequest();
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

  fromJSON(object: any): GetContributionsInfoRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetContributionsInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetContributionsInfoRequest>, I>>(base?: I): GetContributionsInfoRequest {
    return GetContributionsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetContributionsInfoRequest>, I>>(object: I): GetContributionsInfoRequest {
    const message = createBaseGetContributionsInfoRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetContributionsInfoResponse(): GetContributionsInfoResponse {
  return { contributable_story_count: 0, pending_collaboration_request_count: 0 };
}

export const GetContributionsInfoResponse = {
  encode(message: GetContributionsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.contributable_story_count !== 0) {
      writer.uint32(8).uint32(message.contributable_story_count);
    }
    if (message.pending_collaboration_request_count !== 0) {
      writer.uint32(16).uint32(message.pending_collaboration_request_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetContributionsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetContributionsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.contributable_story_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pending_collaboration_request_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetContributionsInfoResponse {
    return {
      contributable_story_count: isSet(object.contributable_story_count)
        ? globalThis.Number(object.contributable_story_count)
        : 0,
      pending_collaboration_request_count: isSet(object.pending_collaboration_request_count)
        ? globalThis.Number(object.pending_collaboration_request_count)
        : 0,
    };
  },

  toJSON(message: GetContributionsInfoResponse): unknown {
    const obj: any = {};
    if (message.contributable_story_count !== 0) {
      obj.contributable_story_count = Math.round(message.contributable_story_count);
    }
    if (message.pending_collaboration_request_count !== 0) {
      obj.pending_collaboration_request_count = Math.round(message.pending_collaboration_request_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetContributionsInfoResponse>, I>>(base?: I): GetContributionsInfoResponse {
    return GetContributionsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetContributionsInfoResponse>, I>>(object: I): GetContributionsInfoResponse {
    const message = createBaseGetContributionsInfoResponse();
    message.contributable_story_count = object.contributable_story_count ?? 0;
    message.pending_collaboration_request_count = object.pending_collaboration_request_count ?? 0;
    return message;
  },
};

function createBaseGetStoryRequest(): GetStoryRequest {
  return { id_or_slug: "", current_user_id: undefined };
}

export const GetStoryRequest = {
  encode(message: GetStoryRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id_or_slug !== "") {
      writer.uint32(10).string(message.id_or_slug);
    }
    if (message.current_user_id !== undefined) {
      writer.uint32(18).string(message.current_user_id);
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

          message.current_user_id = reader.string();
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
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetStoryRequest): unknown {
    const obj: any = {};
    if (message.id_or_slug !== "") {
      obj.id_or_slug = message.id_or_slug;
    }
    if (message.current_user_id !== undefined) {
      obj.current_user_id = message.current_user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryRequest>, I>>(base?: I): GetStoryRequest {
    return GetStoryRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryRequest>, I>>(object: I): GetStoryRequest {
    const message = createBaseGetStoryRequest();
    message.id_or_slug = object.id_or_slug ?? "";
    message.current_user_id = object.current_user_id ?? undefined;
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
    disable_comments: false,
    disable_public_revision_history: false,
    disable_toc: false,
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
    contributors: [],
    tags: [],
    blog: undefined,
    is_bookmarked: false,
    is_liked: false,
    reading_session_token: "",
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
      writer.uint32(80).uint32(message.like_count);
    }
    if (message.read_count !== 0) {
      writer.uint32(88).uint32(message.read_count);
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
    if (message.disable_comments === true) {
      writer.uint32(136).bool(message.disable_comments);
    }
    if (message.disable_public_revision_history === true) {
      writer.uint32(144).bool(message.disable_public_revision_history);
    }
    if (message.disable_toc === true) {
      writer.uint32(152).bool(message.disable_toc);
    }
    if (message.canonical_url !== undefined) {
      writer.uint32(162).string(message.canonical_url);
    }
    if (message.seo_description !== undefined) {
      writer.uint32(170).string(message.seo_description);
    }
    if (message.seo_title !== undefined) {
      writer.uint32(178).string(message.seo_title);
    }
    if (message.preview_image !== undefined) {
      writer.uint32(186).string(message.preview_image);
    }
    if (message.created_at !== "") {
      writer.uint32(194).string(message.created_at);
    }
    if (message.edited_at !== undefined) {
      writer.uint32(202).string(message.edited_at);
    }
    if (message.published_at !== undefined) {
      writer.uint32(210).string(message.published_at);
    }
    if (message.first_published_at !== undefined) {
      writer.uint32(218).string(message.first_published_at);
    }
    if (message.deleted_at !== undefined) {
      writer.uint32(226).string(message.deleted_at);
    }
    if (message.user !== undefined) {
      ExtendedUser.encode(message.user, writer.uint32(234).fork()).ldelim();
    }
    for (const v of message.contributors) {
      BareUser.encode(v!, writer.uint32(242).fork()).ldelim();
    }
    for (const v of message.tags) {
      Tag.encode(v!, writer.uint32(250).fork()).ldelim();
    }
    if (message.blog !== undefined) {
      BareBlog.encode(message.blog, writer.uint32(258).fork()).ldelim();
    }
    if (message.is_bookmarked === true) {
      writer.uint32(264).bool(message.is_bookmarked);
    }
    if (message.is_liked === true) {
      writer.uint32(272).bool(message.is_liked);
    }
    if (message.reading_session_token !== "") {
      writer.uint32(282).string(message.reading_session_token);
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

          message.like_count = reader.uint32();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.read_count = reader.uint32();
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
          if (tag !== 136) {
            break;
          }

          message.disable_comments = reader.bool();
          continue;
        case 18:
          if (tag !== 144) {
            break;
          }

          message.disable_public_revision_history = reader.bool();
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.disable_toc = reader.bool();
          continue;
        case 20:
          if (tag !== 162) {
            break;
          }

          message.canonical_url = reader.string();
          continue;
        case 21:
          if (tag !== 170) {
            break;
          }

          message.seo_description = reader.string();
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          message.seo_title = reader.string();
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          message.preview_image = reader.string();
          continue;
        case 24:
          if (tag !== 194) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 25:
          if (tag !== 202) {
            break;
          }

          message.edited_at = reader.string();
          continue;
        case 26:
          if (tag !== 210) {
            break;
          }

          message.published_at = reader.string();
          continue;
        case 27:
          if (tag !== 218) {
            break;
          }

          message.first_published_at = reader.string();
          continue;
        case 28:
          if (tag !== 226) {
            break;
          }

          message.deleted_at = reader.string();
          continue;
        case 29:
          if (tag !== 234) {
            break;
          }

          message.user = ExtendedUser.decode(reader, reader.uint32());
          continue;
        case 30:
          if (tag !== 242) {
            break;
          }

          message.contributors.push(BareUser.decode(reader, reader.uint32()));
          continue;
        case 31:
          if (tag !== 250) {
            break;
          }

          message.tags.push(Tag.decode(reader, reader.uint32()));
          continue;
        case 32:
          if (tag !== 258) {
            break;
          }

          message.blog = BareBlog.decode(reader, reader.uint32());
          continue;
        case 33:
          if (tag !== 264) {
            break;
          }

          message.is_bookmarked = reader.bool();
          continue;
        case 34:
          if (tag !== 272) {
            break;
          }

          message.is_liked = reader.bool();
          continue;
        case 35:
          if (tag !== 282) {
            break;
          }

          message.reading_session_token = reader.string();
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
      disable_comments: isSet(object.disable_comments) ? globalThis.Boolean(object.disable_comments) : false,
      disable_public_revision_history: isSet(object.disable_public_revision_history)
        ? globalThis.Boolean(object.disable_public_revision_history)
        : false,
      disable_toc: isSet(object.disable_toc) ? globalThis.Boolean(object.disable_toc) : false,
      canonical_url: isSet(object.canonical_url) ? globalThis.String(object.canonical_url) : undefined,
      seo_description: isSet(object.seo_description) ? globalThis.String(object.seo_description) : undefined,
      seo_title: isSet(object.seo_title) ? globalThis.String(object.seo_title) : undefined,
      preview_image: isSet(object.preview_image) ? globalThis.String(object.preview_image) : undefined,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      edited_at: isSet(object.edited_at) ? globalThis.String(object.edited_at) : undefined,
      published_at: isSet(object.published_at) ? globalThis.String(object.published_at) : undefined,
      first_published_at: isSet(object.first_published_at) ? globalThis.String(object.first_published_at) : undefined,
      deleted_at: isSet(object.deleted_at) ? globalThis.String(object.deleted_at) : undefined,
      user: isSet(object.user) ? ExtendedUser.fromJSON(object.user) : undefined,
      contributors: globalThis.Array.isArray(object?.contributors)
        ? object.contributors.map((e: any) => BareUser.fromJSON(e))
        : [],
      tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e: any) => Tag.fromJSON(e)) : [],
      blog: isSet(object.blog) ? BareBlog.fromJSON(object.blog) : undefined,
      is_bookmarked: isSet(object.is_bookmarked) ? globalThis.Boolean(object.is_bookmarked) : false,
      is_liked: isSet(object.is_liked) ? globalThis.Boolean(object.is_liked) : false,
      reading_session_token: isSet(object.reading_session_token) ? globalThis.String(object.reading_session_token) : "",
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
    if (message.disable_comments === true) {
      obj.disable_comments = message.disable_comments;
    }
    if (message.disable_public_revision_history === true) {
      obj.disable_public_revision_history = message.disable_public_revision_history;
    }
    if (message.disable_toc === true) {
      obj.disable_toc = message.disable_toc;
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
      obj.user = ExtendedUser.toJSON(message.user);
    }
    if (message.contributors?.length) {
      obj.contributors = message.contributors.map((e) => BareUser.toJSON(e));
    }
    if (message.tags?.length) {
      obj.tags = message.tags.map((e) => Tag.toJSON(e));
    }
    if (message.blog !== undefined) {
      obj.blog = BareBlog.toJSON(message.blog);
    }
    if (message.is_bookmarked === true) {
      obj.is_bookmarked = message.is_bookmarked;
    }
    if (message.is_liked === true) {
      obj.is_liked = message.is_liked;
    }
    if (message.reading_session_token !== "") {
      obj.reading_session_token = message.reading_session_token;
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
    message.disable_comments = object.disable_comments ?? false;
    message.disable_public_revision_history = object.disable_public_revision_history ?? false;
    message.disable_toc = object.disable_toc ?? false;
    message.canonical_url = object.canonical_url ?? undefined;
    message.seo_description = object.seo_description ?? undefined;
    message.seo_title = object.seo_title ?? undefined;
    message.preview_image = object.preview_image ?? undefined;
    message.created_at = object.created_at ?? "";
    message.edited_at = object.edited_at ?? undefined;
    message.published_at = object.published_at ?? undefined;
    message.first_published_at = object.first_published_at ?? undefined;
    message.deleted_at = object.deleted_at ?? undefined;
    message.user = (object.user !== undefined && object.user !== null)
      ? ExtendedUser.fromPartial(object.user)
      : undefined;
    message.contributors = object.contributors?.map((e) => BareUser.fromPartial(e)) || [];
    message.tags = object.tags?.map((e) => Tag.fromPartial(e)) || [];
    message.blog = (object.blog !== undefined && object.blog !== null) ? BareBlog.fromPartial(object.blog) : undefined;
    message.is_bookmarked = object.is_bookmarked ?? false;
    message.is_liked = object.is_liked ?? false;
    message.reading_session_token = object.reading_session_token ?? "";
    return message;
  },
};

function createBaseGetStoryMetadataRequest(): GetStoryMetadataRequest {
  return { id_or_slug: "", user_id: "" };
}

export const GetStoryMetadataRequest = {
  encode(message: GetStoryMetadataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id_or_slug !== "") {
      writer.uint32(10).string(message.id_or_slug);
    }
    if (message.user_id !== "") {
      writer.uint32(18).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryMetadataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryMetadataRequest();
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

  fromJSON(object: any): GetStoryMetadataRequest {
    return {
      id_or_slug: isSet(object.id_or_slug) ? globalThis.String(object.id_or_slug) : "",
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
    };
  },

  toJSON(message: GetStoryMetadataRequest): unknown {
    const obj: any = {};
    if (message.id_or_slug !== "") {
      obj.id_or_slug = message.id_or_slug;
    }
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryMetadataRequest>, I>>(base?: I): GetStoryMetadataRequest {
    return GetStoryMetadataRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryMetadataRequest>, I>>(object: I): GetStoryMetadataRequest {
    const message = createBaseGetStoryMetadataRequest();
    message.id_or_slug = object.id_or_slug ?? "";
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetStoryMetadataResponse(): GetStoryMetadataResponse {
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
    role: "",
    age_restriction: 0,
    license: 0,
    visibility: 0,
    disable_comments: false,
    disable_public_revision_history: false,
    disable_toc: false,
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
    blog: undefined,
    tags: [],
  };
}

export const GetStoryMetadataResponse = {
  encode(message: GetStoryMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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
    if (message.role !== "") {
      writer.uint32(82).string(message.role);
    }
    if (message.age_restriction !== 0) {
      writer.uint32(88).int32(message.age_restriction);
    }
    if (message.license !== 0) {
      writer.uint32(96).int32(message.license);
    }
    if (message.visibility !== 0) {
      writer.uint32(104).int32(message.visibility);
    }
    if (message.disable_comments === true) {
      writer.uint32(112).bool(message.disable_comments);
    }
    if (message.disable_public_revision_history === true) {
      writer.uint32(120).bool(message.disable_public_revision_history);
    }
    if (message.disable_toc === true) {
      writer.uint32(128).bool(message.disable_toc);
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
      BareUser.encode(message.user, writer.uint32(210).fork()).ldelim();
    }
    if (message.blog !== undefined) {
      BareBlog.encode(message.blog, writer.uint32(218).fork()).ldelim();
    }
    for (const v of message.tags) {
      Tag.encode(v!, writer.uint32(226).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetStoryMetadataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetStoryMetadataResponse();
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
          if (tag !== 82) {
            break;
          }

          message.role = reader.string();
          continue;
        case 11:
          if (tag !== 88) {
            break;
          }

          message.age_restriction = reader.int32() as any;
          continue;
        case 12:
          if (tag !== 96) {
            break;
          }

          message.license = reader.int32() as any;
          continue;
        case 13:
          if (tag !== 104) {
            break;
          }

          message.visibility = reader.int32() as any;
          continue;
        case 14:
          if (tag !== 112) {
            break;
          }

          message.disable_comments = reader.bool();
          continue;
        case 15:
          if (tag !== 120) {
            break;
          }

          message.disable_public_revision_history = reader.bool();
          continue;
        case 16:
          if (tag !== 128) {
            break;
          }

          message.disable_toc = reader.bool();
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

          message.user = BareUser.decode(reader, reader.uint32());
          continue;
        case 27:
          if (tag !== 218) {
            break;
          }

          message.blog = BareBlog.decode(reader, reader.uint32());
          continue;
        case 28:
          if (tag !== 226) {
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

  fromJSON(object: any): GetStoryMetadataResponse {
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
      role: isSet(object.role) ? globalThis.String(object.role) : "",
      age_restriction: isSet(object.age_restriction) ? storyAgeRestrictionFromJSON(object.age_restriction) : 0,
      license: isSet(object.license) ? storyLicenseFromJSON(object.license) : 0,
      visibility: isSet(object.visibility) ? storyVisibilityFromJSON(object.visibility) : 0,
      disable_comments: isSet(object.disable_comments) ? globalThis.Boolean(object.disable_comments) : false,
      disable_public_revision_history: isSet(object.disable_public_revision_history)
        ? globalThis.Boolean(object.disable_public_revision_history)
        : false,
      disable_toc: isSet(object.disable_toc) ? globalThis.Boolean(object.disable_toc) : false,
      canonical_url: isSet(object.canonical_url) ? globalThis.String(object.canonical_url) : undefined,
      seo_description: isSet(object.seo_description) ? globalThis.String(object.seo_description) : undefined,
      seo_title: isSet(object.seo_title) ? globalThis.String(object.seo_title) : undefined,
      preview_image: isSet(object.preview_image) ? globalThis.String(object.preview_image) : undefined,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      edited_at: isSet(object.edited_at) ? globalThis.String(object.edited_at) : undefined,
      published_at: isSet(object.published_at) ? globalThis.String(object.published_at) : undefined,
      first_published_at: isSet(object.first_published_at) ? globalThis.String(object.first_published_at) : undefined,
      deleted_at: isSet(object.deleted_at) ? globalThis.String(object.deleted_at) : undefined,
      user: isSet(object.user) ? BareUser.fromJSON(object.user) : undefined,
      blog: isSet(object.blog) ? BareBlog.fromJSON(object.blog) : undefined,
      tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e: any) => Tag.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetStoryMetadataResponse): unknown {
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
    if (message.role !== "") {
      obj.role = message.role;
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
    if (message.disable_comments === true) {
      obj.disable_comments = message.disable_comments;
    }
    if (message.disable_public_revision_history === true) {
      obj.disable_public_revision_history = message.disable_public_revision_history;
    }
    if (message.disable_toc === true) {
      obj.disable_toc = message.disable_toc;
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
      obj.user = BareUser.toJSON(message.user);
    }
    if (message.blog !== undefined) {
      obj.blog = BareBlog.toJSON(message.blog);
    }
    if (message.tags?.length) {
      obj.tags = message.tags.map((e) => Tag.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetStoryMetadataResponse>, I>>(base?: I): GetStoryMetadataResponse {
    return GetStoryMetadataResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetStoryMetadataResponse>, I>>(object: I): GetStoryMetadataResponse {
    const message = createBaseGetStoryMetadataResponse();
    message.id = object.id ?? "";
    message.title = object.title ?? "";
    message.slug = object.slug ?? undefined;
    message.description = object.description ?? undefined;
    message.splash_id = object.splash_id ?? undefined;
    message.splash_hex = object.splash_hex ?? undefined;
    message.doc_key = object.doc_key ?? "";
    message.category = object.category ?? "";
    message.user_id = object.user_id ?? "";
    message.role = object.role ?? "";
    message.age_restriction = object.age_restriction ?? 0;
    message.license = object.license ?? 0;
    message.visibility = object.visibility ?? 0;
    message.disable_comments = object.disable_comments ?? false;
    message.disable_public_revision_history = object.disable_public_revision_history ?? false;
    message.disable_toc = object.disable_toc ?? false;
    message.canonical_url = object.canonical_url ?? undefined;
    message.seo_description = object.seo_description ?? undefined;
    message.seo_title = object.seo_title ?? undefined;
    message.preview_image = object.preview_image ?? undefined;
    message.created_at = object.created_at ?? "";
    message.edited_at = object.edited_at ?? undefined;
    message.published_at = object.published_at ?? undefined;
    message.first_published_at = object.first_published_at ?? undefined;
    message.deleted_at = object.deleted_at ?? undefined;
    message.user = (object.user !== undefined && object.user !== null) ? BareUser.fromPartial(object.user) : undefined;
    message.blog = (object.blog !== undefined && object.blog !== null) ? BareBlog.fromPartial(object.blog) : undefined;
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
