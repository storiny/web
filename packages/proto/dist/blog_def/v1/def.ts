/* eslint-disable */
import _m0 from "protobufjs/minimal";
import { BareUser } from "../../user_def/v1/def";

export const protobufPackage = "blog_def.v1";

export interface BareBlog {
  id: string;
  slug: string;
  domain?: string | undefined;
  name: string;
  logo_id?: string | undefined;
  logo_hex?: string | undefined;
}

export interface LeftSidebarItem {
  id: string;
  name: string;
  icon?: string | undefined;
  target: string;
}

export interface RightSidebarItem {
  id: string;
  primary_text: string;
  secondary_text?: string | undefined;
  icon?: string | undefined;
  target: string;
}

export interface GetBlogRequest {
  identifier: string;
  current_user_id?: string | undefined;
}

export interface GetBlogResponse {
  id: string;
  name: string;
  slug: string;
  description?:
    | string
    | undefined;
  /** Banner */
  banner_id?: string | undefined;
  banner_hex?:
    | string
    | undefined;
  /** Logo */
  logo_id?: string | undefined;
  logo_hex?:
    | string
    | undefined;
  /** Newsletter splash */
  newsletter_splash_id?: string | undefined;
  newsletter_splash_hex?:
    | string
    | undefined;
  /** Mark */
  mark_light?: string | undefined;
  mark_dark?:
    | string
    | undefined;
  /** Font */
  font_code?: string | undefined;
  font_primary?: string | undefined;
  font_secondary?:
    | string
    | undefined;
  /** Theme */
  default_theme?: string | undefined;
  force_theme: boolean;
  favicon?: string | undefined;
  hide_storiny_branding: boolean;
  is_homepage_large_layout: boolean;
  is_story_minimal_layout: boolean;
  /** SEO */
  seo_description?: string | undefined;
  seo_title?: string | undefined;
  preview_image?:
    | string
    | undefined;
  /** Boolean flags */
  is_following: boolean;
  is_owner: boolean;
  is_editor: boolean;
  is_writer: boolean;
  is_external: boolean;
  has_plus_features: boolean;
  /** Connections */
  website_url?: string | undefined;
  public_email?: string | undefined;
  github_url?: string | undefined;
  instagram_url?: string | undefined;
  linkedin_url?: string | undefined;
  youtube_url?: string | undefined;
  twitter_url?: string | undefined;
  twitch_url?:
    | string
    | undefined;
  /** Other props */
  domain?: string | undefined;
  created_at: string;
  category: string;
  user_id: string;
  rsb_items_label: string;
  lsb_items: LeftSidebarItem[];
  rsb_items: RightSidebarItem[];
}

export interface ArchiveTimeline {
  year: number;
  active_months: number[];
}

export interface GetBlogArchiveRequest {
  identifier: string;
}

export interface GetBlogArchiveResponse {
  story_count: number;
  timeline: ArchiveTimeline[];
}

export interface GetUserBlogsInfoRequest {
  user_id: string;
}

export interface GetUserBlogsInfoResponse {
  blog_count: number;
  pending_blog_request_count: number;
  can_create_blog: boolean;
}

export interface GetBlogPendingStoryCountRequest {
  identifier: string;
}

export interface GetBlogPendingStoryCountResponse {
  pending_story_count: number;
}

export interface GetBlogPublishedStoryCountRequest {
  identifier: string;
}

export interface GetBlogPublishedStoryCountResponse {
  published_story_count: number;
}

export interface GetBlogEditorsInfoRequest {
  identifier: string;
}

export interface GetBlogEditorsInfoResponse {
  editor_count: number;
  pending_editor_request_count: number;
}

export interface GetBlogWritersInfoRequest {
  identifier: string;
}

export interface GetBlogWritersInfoResponse {
  writer_count: number;
  pending_writer_request_count: number;
}

export interface GetBlogNewsletterInfoRequest {
  identifier: string;
}

export interface GetBlogNewsletterInfoResponse {
  subscriber_count: number;
}

export interface GetBlogSitemapRequest {
  identifier: string;
}

export interface GetBlogSitemapResponse {
  content: string;
}

export interface GetBlogNewsletterRequest {
  identifier: string;
  current_user_id?: string | undefined;
}

export interface GetBlogNewsletterResponse {
  id: string;
  name: string;
  description?: string | undefined;
  newsletter_splash_id?: string | undefined;
  newsletter_splash_hex?: string | undefined;
  user: BareUser | undefined;
  is_subscribed: boolean;
}

export interface VerifyBlogLoginRequest {
  blog_identifier: string;
  token: string;
  host: string;
}

export interface VerifyBlogLoginResponse {
  cookie_value: string;
}

function createBaseBareBlog(): BareBlog {
  return { id: "", slug: "", domain: undefined, name: "", logo_id: undefined, logo_hex: undefined };
}

export const BareBlog = {
  encode(message: BareBlog, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.slug !== "") {
      writer.uint32(18).string(message.slug);
    }
    if (message.domain !== undefined) {
      writer.uint32(26).string(message.domain);
    }
    if (message.name !== "") {
      writer.uint32(34).string(message.name);
    }
    if (message.logo_id !== undefined) {
      writer.uint32(42).string(message.logo_id);
    }
    if (message.logo_hex !== undefined) {
      writer.uint32(50).string(message.logo_hex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BareBlog {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBareBlog();
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

          message.slug = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.domain = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.name = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.logo_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.logo_hex = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BareBlog {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      slug: isSet(object.slug) ? globalThis.String(object.slug) : "",
      domain: isSet(object.domain) ? globalThis.String(object.domain) : undefined,
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      logo_id: isSet(object.logo_id) ? globalThis.String(object.logo_id) : undefined,
      logo_hex: isSet(object.logo_hex) ? globalThis.String(object.logo_hex) : undefined,
    };
  },

  toJSON(message: BareBlog): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.slug !== "") {
      obj.slug = message.slug;
    }
    if (message.domain !== undefined) {
      obj.domain = message.domain;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.logo_id !== undefined) {
      obj.logo_id = message.logo_id;
    }
    if (message.logo_hex !== undefined) {
      obj.logo_hex = message.logo_hex;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BareBlog>, I>>(base?: I): BareBlog {
    return BareBlog.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BareBlog>, I>>(object: I): BareBlog {
    const message = createBaseBareBlog();
    message.id = object.id ?? "";
    message.slug = object.slug ?? "";
    message.domain = object.domain ?? undefined;
    message.name = object.name ?? "";
    message.logo_id = object.logo_id ?? undefined;
    message.logo_hex = object.logo_hex ?? undefined;
    return message;
  },
};

function createBaseLeftSidebarItem(): LeftSidebarItem {
  return { id: "", name: "", icon: undefined, target: "" };
}

export const LeftSidebarItem = {
  encode(message: LeftSidebarItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.icon !== undefined) {
      writer.uint32(26).string(message.icon);
    }
    if (message.target !== "") {
      writer.uint32(34).string(message.target);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LeftSidebarItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLeftSidebarItem();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.icon = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.target = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LeftSidebarItem {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      icon: isSet(object.icon) ? globalThis.String(object.icon) : undefined,
      target: isSet(object.target) ? globalThis.String(object.target) : "",
    };
  },

  toJSON(message: LeftSidebarItem): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.icon !== undefined) {
      obj.icon = message.icon;
    }
    if (message.target !== "") {
      obj.target = message.target;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<LeftSidebarItem>, I>>(base?: I): LeftSidebarItem {
    return LeftSidebarItem.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<LeftSidebarItem>, I>>(object: I): LeftSidebarItem {
    const message = createBaseLeftSidebarItem();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.icon = object.icon ?? undefined;
    message.target = object.target ?? "";
    return message;
  },
};

function createBaseRightSidebarItem(): RightSidebarItem {
  return { id: "", primary_text: "", secondary_text: undefined, icon: undefined, target: "" };
}

export const RightSidebarItem = {
  encode(message: RightSidebarItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.primary_text !== "") {
      writer.uint32(18).string(message.primary_text);
    }
    if (message.secondary_text !== undefined) {
      writer.uint32(26).string(message.secondary_text);
    }
    if (message.icon !== undefined) {
      writer.uint32(34).string(message.icon);
    }
    if (message.target !== "") {
      writer.uint32(42).string(message.target);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RightSidebarItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRightSidebarItem();
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

          message.primary_text = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.secondary_text = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.icon = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.target = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RightSidebarItem {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      primary_text: isSet(object.primary_text) ? globalThis.String(object.primary_text) : "",
      secondary_text: isSet(object.secondary_text) ? globalThis.String(object.secondary_text) : undefined,
      icon: isSet(object.icon) ? globalThis.String(object.icon) : undefined,
      target: isSet(object.target) ? globalThis.String(object.target) : "",
    };
  },

  toJSON(message: RightSidebarItem): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.primary_text !== "") {
      obj.primary_text = message.primary_text;
    }
    if (message.secondary_text !== undefined) {
      obj.secondary_text = message.secondary_text;
    }
    if (message.icon !== undefined) {
      obj.icon = message.icon;
    }
    if (message.target !== "") {
      obj.target = message.target;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<RightSidebarItem>, I>>(base?: I): RightSidebarItem {
    return RightSidebarItem.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<RightSidebarItem>, I>>(object: I): RightSidebarItem {
    const message = createBaseRightSidebarItem();
    message.id = object.id ?? "";
    message.primary_text = object.primary_text ?? "";
    message.secondary_text = object.secondary_text ?? undefined;
    message.icon = object.icon ?? undefined;
    message.target = object.target ?? "";
    return message;
  },
};

function createBaseGetBlogRequest(): GetBlogRequest {
  return { identifier: "", current_user_id: undefined };
}

export const GetBlogRequest = {
  encode(message: GetBlogRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    if (message.current_user_id !== undefined) {
      writer.uint32(18).string(message.current_user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogRequest();
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

  fromJSON(object: any): GetBlogRequest {
    return {
      identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "",
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetBlogRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    if (message.current_user_id !== undefined) {
      obj.current_user_id = message.current_user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogRequest>, I>>(base?: I): GetBlogRequest {
    return GetBlogRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogRequest>, I>>(object: I): GetBlogRequest {
    const message = createBaseGetBlogRequest();
    message.identifier = object.identifier ?? "";
    message.current_user_id = object.current_user_id ?? undefined;
    return message;
  },
};

function createBaseGetBlogResponse(): GetBlogResponse {
  return {
    id: "",
    name: "",
    slug: "",
    description: undefined,
    banner_id: undefined,
    banner_hex: undefined,
    logo_id: undefined,
    logo_hex: undefined,
    newsletter_splash_id: undefined,
    newsletter_splash_hex: undefined,
    mark_light: undefined,
    mark_dark: undefined,
    font_code: undefined,
    font_primary: undefined,
    font_secondary: undefined,
    default_theme: undefined,
    force_theme: false,
    favicon: undefined,
    hide_storiny_branding: false,
    is_homepage_large_layout: false,
    is_story_minimal_layout: false,
    seo_description: undefined,
    seo_title: undefined,
    preview_image: undefined,
    is_following: false,
    is_owner: false,
    is_editor: false,
    is_writer: false,
    is_external: false,
    has_plus_features: false,
    website_url: undefined,
    public_email: undefined,
    github_url: undefined,
    instagram_url: undefined,
    linkedin_url: undefined,
    youtube_url: undefined,
    twitter_url: undefined,
    twitch_url: undefined,
    domain: undefined,
    created_at: "",
    category: "",
    user_id: "",
    rsb_items_label: "",
    lsb_items: [],
    rsb_items: [],
  };
}

export const GetBlogResponse = {
  encode(message: GetBlogResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.slug !== "") {
      writer.uint32(26).string(message.slug);
    }
    if (message.description !== undefined) {
      writer.uint32(34).string(message.description);
    }
    if (message.banner_id !== undefined) {
      writer.uint32(42).string(message.banner_id);
    }
    if (message.banner_hex !== undefined) {
      writer.uint32(50).string(message.banner_hex);
    }
    if (message.logo_id !== undefined) {
      writer.uint32(58).string(message.logo_id);
    }
    if (message.logo_hex !== undefined) {
      writer.uint32(66).string(message.logo_hex);
    }
    if (message.newsletter_splash_id !== undefined) {
      writer.uint32(74).string(message.newsletter_splash_id);
    }
    if (message.newsletter_splash_hex !== undefined) {
      writer.uint32(82).string(message.newsletter_splash_hex);
    }
    if (message.mark_light !== undefined) {
      writer.uint32(90).string(message.mark_light);
    }
    if (message.mark_dark !== undefined) {
      writer.uint32(98).string(message.mark_dark);
    }
    if (message.font_code !== undefined) {
      writer.uint32(106).string(message.font_code);
    }
    if (message.font_primary !== undefined) {
      writer.uint32(114).string(message.font_primary);
    }
    if (message.font_secondary !== undefined) {
      writer.uint32(122).string(message.font_secondary);
    }
    if (message.default_theme !== undefined) {
      writer.uint32(130).string(message.default_theme);
    }
    if (message.force_theme === true) {
      writer.uint32(136).bool(message.force_theme);
    }
    if (message.favicon !== undefined) {
      writer.uint32(146).string(message.favicon);
    }
    if (message.hide_storiny_branding === true) {
      writer.uint32(152).bool(message.hide_storiny_branding);
    }
    if (message.is_homepage_large_layout === true) {
      writer.uint32(160).bool(message.is_homepage_large_layout);
    }
    if (message.is_story_minimal_layout === true) {
      writer.uint32(168).bool(message.is_story_minimal_layout);
    }
    if (message.seo_description !== undefined) {
      writer.uint32(178).string(message.seo_description);
    }
    if (message.seo_title !== undefined) {
      writer.uint32(186).string(message.seo_title);
    }
    if (message.preview_image !== undefined) {
      writer.uint32(194).string(message.preview_image);
    }
    if (message.is_following === true) {
      writer.uint32(200).bool(message.is_following);
    }
    if (message.is_owner === true) {
      writer.uint32(208).bool(message.is_owner);
    }
    if (message.is_editor === true) {
      writer.uint32(216).bool(message.is_editor);
    }
    if (message.is_writer === true) {
      writer.uint32(224).bool(message.is_writer);
    }
    if (message.is_external === true) {
      writer.uint32(232).bool(message.is_external);
    }
    if (message.has_plus_features === true) {
      writer.uint32(240).bool(message.has_plus_features);
    }
    if (message.website_url !== undefined) {
      writer.uint32(250).string(message.website_url);
    }
    if (message.public_email !== undefined) {
      writer.uint32(258).string(message.public_email);
    }
    if (message.github_url !== undefined) {
      writer.uint32(266).string(message.github_url);
    }
    if (message.instagram_url !== undefined) {
      writer.uint32(274).string(message.instagram_url);
    }
    if (message.linkedin_url !== undefined) {
      writer.uint32(282).string(message.linkedin_url);
    }
    if (message.youtube_url !== undefined) {
      writer.uint32(290).string(message.youtube_url);
    }
    if (message.twitter_url !== undefined) {
      writer.uint32(298).string(message.twitter_url);
    }
    if (message.twitch_url !== undefined) {
      writer.uint32(306).string(message.twitch_url);
    }
    if (message.domain !== undefined) {
      writer.uint32(314).string(message.domain);
    }
    if (message.created_at !== "") {
      writer.uint32(322).string(message.created_at);
    }
    if (message.category !== "") {
      writer.uint32(330).string(message.category);
    }
    if (message.user_id !== "") {
      writer.uint32(338).string(message.user_id);
    }
    if (message.rsb_items_label !== "") {
      writer.uint32(346).string(message.rsb_items_label);
    }
    for (const v of message.lsb_items) {
      LeftSidebarItem.encode(v!, writer.uint32(354).fork()).ldelim();
    }
    for (const v of message.rsb_items) {
      RightSidebarItem.encode(v!, writer.uint32(362).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogResponse();
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

          message.name = reader.string();
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

          message.banner_id = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.banner_hex = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.logo_id = reader.string();
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.logo_hex = reader.string();
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.newsletter_splash_id = reader.string();
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.newsletter_splash_hex = reader.string();
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.mark_light = reader.string();
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.mark_dark = reader.string();
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.font_code = reader.string();
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.font_primary = reader.string();
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.font_secondary = reader.string();
          continue;
        case 16:
          if (tag !== 130) {
            break;
          }

          message.default_theme = reader.string();
          continue;
        case 17:
          if (tag !== 136) {
            break;
          }

          message.force_theme = reader.bool();
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.favicon = reader.string();
          continue;
        case 19:
          if (tag !== 152) {
            break;
          }

          message.hide_storiny_branding = reader.bool();
          continue;
        case 20:
          if (tag !== 160) {
            break;
          }

          message.is_homepage_large_layout = reader.bool();
          continue;
        case 21:
          if (tag !== 168) {
            break;
          }

          message.is_story_minimal_layout = reader.bool();
          continue;
        case 22:
          if (tag !== 178) {
            break;
          }

          message.seo_description = reader.string();
          continue;
        case 23:
          if (tag !== 186) {
            break;
          }

          message.seo_title = reader.string();
          continue;
        case 24:
          if (tag !== 194) {
            break;
          }

          message.preview_image = reader.string();
          continue;
        case 25:
          if (tag !== 200) {
            break;
          }

          message.is_following = reader.bool();
          continue;
        case 26:
          if (tag !== 208) {
            break;
          }

          message.is_owner = reader.bool();
          continue;
        case 27:
          if (tag !== 216) {
            break;
          }

          message.is_editor = reader.bool();
          continue;
        case 28:
          if (tag !== 224) {
            break;
          }

          message.is_writer = reader.bool();
          continue;
        case 29:
          if (tag !== 232) {
            break;
          }

          message.is_external = reader.bool();
          continue;
        case 30:
          if (tag !== 240) {
            break;
          }

          message.has_plus_features = reader.bool();
          continue;
        case 31:
          if (tag !== 250) {
            break;
          }

          message.website_url = reader.string();
          continue;
        case 32:
          if (tag !== 258) {
            break;
          }

          message.public_email = reader.string();
          continue;
        case 33:
          if (tag !== 266) {
            break;
          }

          message.github_url = reader.string();
          continue;
        case 34:
          if (tag !== 274) {
            break;
          }

          message.instagram_url = reader.string();
          continue;
        case 35:
          if (tag !== 282) {
            break;
          }

          message.linkedin_url = reader.string();
          continue;
        case 36:
          if (tag !== 290) {
            break;
          }

          message.youtube_url = reader.string();
          continue;
        case 37:
          if (tag !== 298) {
            break;
          }

          message.twitter_url = reader.string();
          continue;
        case 38:
          if (tag !== 306) {
            break;
          }

          message.twitch_url = reader.string();
          continue;
        case 39:
          if (tag !== 314) {
            break;
          }

          message.domain = reader.string();
          continue;
        case 40:
          if (tag !== 322) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 41:
          if (tag !== 330) {
            break;
          }

          message.category = reader.string();
          continue;
        case 42:
          if (tag !== 338) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 43:
          if (tag !== 346) {
            break;
          }

          message.rsb_items_label = reader.string();
          continue;
        case 44:
          if (tag !== 354) {
            break;
          }

          message.lsb_items.push(LeftSidebarItem.decode(reader, reader.uint32()));
          continue;
        case 45:
          if (tag !== 362) {
            break;
          }

          message.rsb_items.push(RightSidebarItem.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      slug: isSet(object.slug) ? globalThis.String(object.slug) : "",
      description: isSet(object.description) ? globalThis.String(object.description) : undefined,
      banner_id: isSet(object.banner_id) ? globalThis.String(object.banner_id) : undefined,
      banner_hex: isSet(object.banner_hex) ? globalThis.String(object.banner_hex) : undefined,
      logo_id: isSet(object.logo_id) ? globalThis.String(object.logo_id) : undefined,
      logo_hex: isSet(object.logo_hex) ? globalThis.String(object.logo_hex) : undefined,
      newsletter_splash_id: isSet(object.newsletter_splash_id)
        ? globalThis.String(object.newsletter_splash_id)
        : undefined,
      newsletter_splash_hex: isSet(object.newsletter_splash_hex)
        ? globalThis.String(object.newsletter_splash_hex)
        : undefined,
      mark_light: isSet(object.mark_light) ? globalThis.String(object.mark_light) : undefined,
      mark_dark: isSet(object.mark_dark) ? globalThis.String(object.mark_dark) : undefined,
      font_code: isSet(object.font_code) ? globalThis.String(object.font_code) : undefined,
      font_primary: isSet(object.font_primary) ? globalThis.String(object.font_primary) : undefined,
      font_secondary: isSet(object.font_secondary) ? globalThis.String(object.font_secondary) : undefined,
      default_theme: isSet(object.default_theme) ? globalThis.String(object.default_theme) : undefined,
      force_theme: isSet(object.force_theme) ? globalThis.Boolean(object.force_theme) : false,
      favicon: isSet(object.favicon) ? globalThis.String(object.favicon) : undefined,
      hide_storiny_branding: isSet(object.hide_storiny_branding)
        ? globalThis.Boolean(object.hide_storiny_branding)
        : false,
      is_homepage_large_layout: isSet(object.is_homepage_large_layout)
        ? globalThis.Boolean(object.is_homepage_large_layout)
        : false,
      is_story_minimal_layout: isSet(object.is_story_minimal_layout)
        ? globalThis.Boolean(object.is_story_minimal_layout)
        : false,
      seo_description: isSet(object.seo_description) ? globalThis.String(object.seo_description) : undefined,
      seo_title: isSet(object.seo_title) ? globalThis.String(object.seo_title) : undefined,
      preview_image: isSet(object.preview_image) ? globalThis.String(object.preview_image) : undefined,
      is_following: isSet(object.is_following) ? globalThis.Boolean(object.is_following) : false,
      is_owner: isSet(object.is_owner) ? globalThis.Boolean(object.is_owner) : false,
      is_editor: isSet(object.is_editor) ? globalThis.Boolean(object.is_editor) : false,
      is_writer: isSet(object.is_writer) ? globalThis.Boolean(object.is_writer) : false,
      is_external: isSet(object.is_external) ? globalThis.Boolean(object.is_external) : false,
      has_plus_features: isSet(object.has_plus_features) ? globalThis.Boolean(object.has_plus_features) : false,
      website_url: isSet(object.website_url) ? globalThis.String(object.website_url) : undefined,
      public_email: isSet(object.public_email) ? globalThis.String(object.public_email) : undefined,
      github_url: isSet(object.github_url) ? globalThis.String(object.github_url) : undefined,
      instagram_url: isSet(object.instagram_url) ? globalThis.String(object.instagram_url) : undefined,
      linkedin_url: isSet(object.linkedin_url) ? globalThis.String(object.linkedin_url) : undefined,
      youtube_url: isSet(object.youtube_url) ? globalThis.String(object.youtube_url) : undefined,
      twitter_url: isSet(object.twitter_url) ? globalThis.String(object.twitter_url) : undefined,
      twitch_url: isSet(object.twitch_url) ? globalThis.String(object.twitch_url) : undefined,
      domain: isSet(object.domain) ? globalThis.String(object.domain) : undefined,
      created_at: isSet(object.created_at) ? globalThis.String(object.created_at) : "",
      category: isSet(object.category) ? globalThis.String(object.category) : "",
      user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "",
      rsb_items_label: isSet(object.rsb_items_label) ? globalThis.String(object.rsb_items_label) : "",
      lsb_items: globalThis.Array.isArray(object?.lsb_items)
        ? object.lsb_items.map((e: any) => LeftSidebarItem.fromJSON(e))
        : [],
      rsb_items: globalThis.Array.isArray(object?.rsb_items)
        ? object.rsb_items.map((e: any) => RightSidebarItem.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GetBlogResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.slug !== "") {
      obj.slug = message.slug;
    }
    if (message.description !== undefined) {
      obj.description = message.description;
    }
    if (message.banner_id !== undefined) {
      obj.banner_id = message.banner_id;
    }
    if (message.banner_hex !== undefined) {
      obj.banner_hex = message.banner_hex;
    }
    if (message.logo_id !== undefined) {
      obj.logo_id = message.logo_id;
    }
    if (message.logo_hex !== undefined) {
      obj.logo_hex = message.logo_hex;
    }
    if (message.newsletter_splash_id !== undefined) {
      obj.newsletter_splash_id = message.newsletter_splash_id;
    }
    if (message.newsletter_splash_hex !== undefined) {
      obj.newsletter_splash_hex = message.newsletter_splash_hex;
    }
    if (message.mark_light !== undefined) {
      obj.mark_light = message.mark_light;
    }
    if (message.mark_dark !== undefined) {
      obj.mark_dark = message.mark_dark;
    }
    if (message.font_code !== undefined) {
      obj.font_code = message.font_code;
    }
    if (message.font_primary !== undefined) {
      obj.font_primary = message.font_primary;
    }
    if (message.font_secondary !== undefined) {
      obj.font_secondary = message.font_secondary;
    }
    if (message.default_theme !== undefined) {
      obj.default_theme = message.default_theme;
    }
    if (message.force_theme === true) {
      obj.force_theme = message.force_theme;
    }
    if (message.favicon !== undefined) {
      obj.favicon = message.favicon;
    }
    if (message.hide_storiny_branding === true) {
      obj.hide_storiny_branding = message.hide_storiny_branding;
    }
    if (message.is_homepage_large_layout === true) {
      obj.is_homepage_large_layout = message.is_homepage_large_layout;
    }
    if (message.is_story_minimal_layout === true) {
      obj.is_story_minimal_layout = message.is_story_minimal_layout;
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
    if (message.is_following === true) {
      obj.is_following = message.is_following;
    }
    if (message.is_owner === true) {
      obj.is_owner = message.is_owner;
    }
    if (message.is_editor === true) {
      obj.is_editor = message.is_editor;
    }
    if (message.is_writer === true) {
      obj.is_writer = message.is_writer;
    }
    if (message.is_external === true) {
      obj.is_external = message.is_external;
    }
    if (message.has_plus_features === true) {
      obj.has_plus_features = message.has_plus_features;
    }
    if (message.website_url !== undefined) {
      obj.website_url = message.website_url;
    }
    if (message.public_email !== undefined) {
      obj.public_email = message.public_email;
    }
    if (message.github_url !== undefined) {
      obj.github_url = message.github_url;
    }
    if (message.instagram_url !== undefined) {
      obj.instagram_url = message.instagram_url;
    }
    if (message.linkedin_url !== undefined) {
      obj.linkedin_url = message.linkedin_url;
    }
    if (message.youtube_url !== undefined) {
      obj.youtube_url = message.youtube_url;
    }
    if (message.twitter_url !== undefined) {
      obj.twitter_url = message.twitter_url;
    }
    if (message.twitch_url !== undefined) {
      obj.twitch_url = message.twitch_url;
    }
    if (message.domain !== undefined) {
      obj.domain = message.domain;
    }
    if (message.created_at !== "") {
      obj.created_at = message.created_at;
    }
    if (message.category !== "") {
      obj.category = message.category;
    }
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    if (message.rsb_items_label !== "") {
      obj.rsb_items_label = message.rsb_items_label;
    }
    if (message.lsb_items?.length) {
      obj.lsb_items = message.lsb_items.map((e) => LeftSidebarItem.toJSON(e));
    }
    if (message.rsb_items?.length) {
      obj.rsb_items = message.rsb_items.map((e) => RightSidebarItem.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogResponse>, I>>(base?: I): GetBlogResponse {
    return GetBlogResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogResponse>, I>>(object: I): GetBlogResponse {
    const message = createBaseGetBlogResponse();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.slug = object.slug ?? "";
    message.description = object.description ?? undefined;
    message.banner_id = object.banner_id ?? undefined;
    message.banner_hex = object.banner_hex ?? undefined;
    message.logo_id = object.logo_id ?? undefined;
    message.logo_hex = object.logo_hex ?? undefined;
    message.newsletter_splash_id = object.newsletter_splash_id ?? undefined;
    message.newsletter_splash_hex = object.newsletter_splash_hex ?? undefined;
    message.mark_light = object.mark_light ?? undefined;
    message.mark_dark = object.mark_dark ?? undefined;
    message.font_code = object.font_code ?? undefined;
    message.font_primary = object.font_primary ?? undefined;
    message.font_secondary = object.font_secondary ?? undefined;
    message.default_theme = object.default_theme ?? undefined;
    message.force_theme = object.force_theme ?? false;
    message.favicon = object.favicon ?? undefined;
    message.hide_storiny_branding = object.hide_storiny_branding ?? false;
    message.is_homepage_large_layout = object.is_homepage_large_layout ?? false;
    message.is_story_minimal_layout = object.is_story_minimal_layout ?? false;
    message.seo_description = object.seo_description ?? undefined;
    message.seo_title = object.seo_title ?? undefined;
    message.preview_image = object.preview_image ?? undefined;
    message.is_following = object.is_following ?? false;
    message.is_owner = object.is_owner ?? false;
    message.is_editor = object.is_editor ?? false;
    message.is_writer = object.is_writer ?? false;
    message.is_external = object.is_external ?? false;
    message.has_plus_features = object.has_plus_features ?? false;
    message.website_url = object.website_url ?? undefined;
    message.public_email = object.public_email ?? undefined;
    message.github_url = object.github_url ?? undefined;
    message.instagram_url = object.instagram_url ?? undefined;
    message.linkedin_url = object.linkedin_url ?? undefined;
    message.youtube_url = object.youtube_url ?? undefined;
    message.twitter_url = object.twitter_url ?? undefined;
    message.twitch_url = object.twitch_url ?? undefined;
    message.domain = object.domain ?? undefined;
    message.created_at = object.created_at ?? "";
    message.category = object.category ?? "";
    message.user_id = object.user_id ?? "";
    message.rsb_items_label = object.rsb_items_label ?? "";
    message.lsb_items = object.lsb_items?.map((e) => LeftSidebarItem.fromPartial(e)) || [];
    message.rsb_items = object.rsb_items?.map((e) => RightSidebarItem.fromPartial(e)) || [];
    return message;
  },
};

function createBaseArchiveTimeline(): ArchiveTimeline {
  return { year: 0, active_months: [] };
}

export const ArchiveTimeline = {
  encode(message: ArchiveTimeline, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.year !== 0) {
      writer.uint32(8).uint32(message.year);
    }
    writer.uint32(18).fork();
    for (const v of message.active_months) {
      writer.uint32(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ArchiveTimeline {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseArchiveTimeline();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.year = reader.uint32();
          continue;
        case 2:
          if (tag === 16) {
            message.active_months.push(reader.uint32());

            continue;
          }

          if (tag === 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.active_months.push(reader.uint32());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ArchiveTimeline {
    return {
      year: isSet(object.year) ? globalThis.Number(object.year) : 0,
      active_months: globalThis.Array.isArray(object?.active_months)
        ? object.active_months.map((e: any) => globalThis.Number(e))
        : [],
    };
  },

  toJSON(message: ArchiveTimeline): unknown {
    const obj: any = {};
    if (message.year !== 0) {
      obj.year = Math.round(message.year);
    }
    if (message.active_months?.length) {
      obj.active_months = message.active_months.map((e) => Math.round(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ArchiveTimeline>, I>>(base?: I): ArchiveTimeline {
    return ArchiveTimeline.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ArchiveTimeline>, I>>(object: I): ArchiveTimeline {
    const message = createBaseArchiveTimeline();
    message.year = object.year ?? 0;
    message.active_months = object.active_months?.map((e) => e) || [];
    return message;
  },
};

function createBaseGetBlogArchiveRequest(): GetBlogArchiveRequest {
  return { identifier: "" };
}

export const GetBlogArchiveRequest = {
  encode(message: GetBlogArchiveRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogArchiveRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogArchiveRequest();
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

  fromJSON(object: any): GetBlogArchiveRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogArchiveRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogArchiveRequest>, I>>(base?: I): GetBlogArchiveRequest {
    return GetBlogArchiveRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogArchiveRequest>, I>>(object: I): GetBlogArchiveRequest {
    const message = createBaseGetBlogArchiveRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogArchiveResponse(): GetBlogArchiveResponse {
  return { story_count: 0, timeline: [] };
}

export const GetBlogArchiveResponse = {
  encode(message: GetBlogArchiveResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.story_count !== 0) {
      writer.uint32(8).uint32(message.story_count);
    }
    for (const v of message.timeline) {
      ArchiveTimeline.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogArchiveResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogArchiveResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.story_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.timeline.push(ArchiveTimeline.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogArchiveResponse {
    return {
      story_count: isSet(object.story_count) ? globalThis.Number(object.story_count) : 0,
      timeline: globalThis.Array.isArray(object?.timeline)
        ? object.timeline.map((e: any) => ArchiveTimeline.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GetBlogArchiveResponse): unknown {
    const obj: any = {};
    if (message.story_count !== 0) {
      obj.story_count = Math.round(message.story_count);
    }
    if (message.timeline?.length) {
      obj.timeline = message.timeline.map((e) => ArchiveTimeline.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogArchiveResponse>, I>>(base?: I): GetBlogArchiveResponse {
    return GetBlogArchiveResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogArchiveResponse>, I>>(object: I): GetBlogArchiveResponse {
    const message = createBaseGetBlogArchiveResponse();
    message.story_count = object.story_count ?? 0;
    message.timeline = object.timeline?.map((e) => ArchiveTimeline.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGetUserBlogsInfoRequest(): GetUserBlogsInfoRequest {
  return { user_id: "" };
}

export const GetUserBlogsInfoRequest = {
  encode(message: GetUserBlogsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.user_id !== "") {
      writer.uint32(10).string(message.user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserBlogsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserBlogsInfoRequest();
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

  fromJSON(object: any): GetUserBlogsInfoRequest {
    return { user_id: isSet(object.user_id) ? globalThis.String(object.user_id) : "" };
  },

  toJSON(message: GetUserBlogsInfoRequest): unknown {
    const obj: any = {};
    if (message.user_id !== "") {
      obj.user_id = message.user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserBlogsInfoRequest>, I>>(base?: I): GetUserBlogsInfoRequest {
    return GetUserBlogsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserBlogsInfoRequest>, I>>(object: I): GetUserBlogsInfoRequest {
    const message = createBaseGetUserBlogsInfoRequest();
    message.user_id = object.user_id ?? "";
    return message;
  },
};

function createBaseGetUserBlogsInfoResponse(): GetUserBlogsInfoResponse {
  return { blog_count: 0, pending_blog_request_count: 0, can_create_blog: false };
}

export const GetUserBlogsInfoResponse = {
  encode(message: GetUserBlogsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blog_count !== 0) {
      writer.uint32(8).uint32(message.blog_count);
    }
    if (message.pending_blog_request_count !== 0) {
      writer.uint32(16).uint32(message.pending_blog_request_count);
    }
    if (message.can_create_blog === true) {
      writer.uint32(24).bool(message.can_create_blog);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetUserBlogsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUserBlogsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.blog_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pending_blog_request_count = reader.uint32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.can_create_blog = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetUserBlogsInfoResponse {
    return {
      blog_count: isSet(object.blog_count) ? globalThis.Number(object.blog_count) : 0,
      pending_blog_request_count: isSet(object.pending_blog_request_count)
        ? globalThis.Number(object.pending_blog_request_count)
        : 0,
      can_create_blog: isSet(object.can_create_blog) ? globalThis.Boolean(object.can_create_blog) : false,
    };
  },

  toJSON(message: GetUserBlogsInfoResponse): unknown {
    const obj: any = {};
    if (message.blog_count !== 0) {
      obj.blog_count = Math.round(message.blog_count);
    }
    if (message.pending_blog_request_count !== 0) {
      obj.pending_blog_request_count = Math.round(message.pending_blog_request_count);
    }
    if (message.can_create_blog === true) {
      obj.can_create_blog = message.can_create_blog;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetUserBlogsInfoResponse>, I>>(base?: I): GetUserBlogsInfoResponse {
    return GetUserBlogsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetUserBlogsInfoResponse>, I>>(object: I): GetUserBlogsInfoResponse {
    const message = createBaseGetUserBlogsInfoResponse();
    message.blog_count = object.blog_count ?? 0;
    message.pending_blog_request_count = object.pending_blog_request_count ?? 0;
    message.can_create_blog = object.can_create_blog ?? false;
    return message;
  },
};

function createBaseGetBlogPendingStoryCountRequest(): GetBlogPendingStoryCountRequest {
  return { identifier: "" };
}

export const GetBlogPendingStoryCountRequest = {
  encode(message: GetBlogPendingStoryCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogPendingStoryCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogPendingStoryCountRequest();
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

  fromJSON(object: any): GetBlogPendingStoryCountRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogPendingStoryCountRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogPendingStoryCountRequest>, I>>(base?: I): GetBlogPendingStoryCountRequest {
    return GetBlogPendingStoryCountRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogPendingStoryCountRequest>, I>>(
    object: I,
  ): GetBlogPendingStoryCountRequest {
    const message = createBaseGetBlogPendingStoryCountRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogPendingStoryCountResponse(): GetBlogPendingStoryCountResponse {
  return { pending_story_count: 0 };
}

export const GetBlogPendingStoryCountResponse = {
  encode(message: GetBlogPendingStoryCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pending_story_count !== 0) {
      writer.uint32(8).uint32(message.pending_story_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogPendingStoryCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogPendingStoryCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.pending_story_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogPendingStoryCountResponse {
    return {
      pending_story_count: isSet(object.pending_story_count) ? globalThis.Number(object.pending_story_count) : 0,
    };
  },

  toJSON(message: GetBlogPendingStoryCountResponse): unknown {
    const obj: any = {};
    if (message.pending_story_count !== 0) {
      obj.pending_story_count = Math.round(message.pending_story_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogPendingStoryCountResponse>, I>>(
    base?: I,
  ): GetBlogPendingStoryCountResponse {
    return GetBlogPendingStoryCountResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogPendingStoryCountResponse>, I>>(
    object: I,
  ): GetBlogPendingStoryCountResponse {
    const message = createBaseGetBlogPendingStoryCountResponse();
    message.pending_story_count = object.pending_story_count ?? 0;
    return message;
  },
};

function createBaseGetBlogPublishedStoryCountRequest(): GetBlogPublishedStoryCountRequest {
  return { identifier: "" };
}

export const GetBlogPublishedStoryCountRequest = {
  encode(message: GetBlogPublishedStoryCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogPublishedStoryCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogPublishedStoryCountRequest();
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

  fromJSON(object: any): GetBlogPublishedStoryCountRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogPublishedStoryCountRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogPublishedStoryCountRequest>, I>>(
    base?: I,
  ): GetBlogPublishedStoryCountRequest {
    return GetBlogPublishedStoryCountRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogPublishedStoryCountRequest>, I>>(
    object: I,
  ): GetBlogPublishedStoryCountRequest {
    const message = createBaseGetBlogPublishedStoryCountRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogPublishedStoryCountResponse(): GetBlogPublishedStoryCountResponse {
  return { published_story_count: 0 };
}

export const GetBlogPublishedStoryCountResponse = {
  encode(message: GetBlogPublishedStoryCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.published_story_count !== 0) {
      writer.uint32(8).uint32(message.published_story_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogPublishedStoryCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogPublishedStoryCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.published_story_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogPublishedStoryCountResponse {
    return {
      published_story_count: isSet(object.published_story_count) ? globalThis.Number(object.published_story_count) : 0,
    };
  },

  toJSON(message: GetBlogPublishedStoryCountResponse): unknown {
    const obj: any = {};
    if (message.published_story_count !== 0) {
      obj.published_story_count = Math.round(message.published_story_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogPublishedStoryCountResponse>, I>>(
    base?: I,
  ): GetBlogPublishedStoryCountResponse {
    return GetBlogPublishedStoryCountResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogPublishedStoryCountResponse>, I>>(
    object: I,
  ): GetBlogPublishedStoryCountResponse {
    const message = createBaseGetBlogPublishedStoryCountResponse();
    message.published_story_count = object.published_story_count ?? 0;
    return message;
  },
};

function createBaseGetBlogEditorsInfoRequest(): GetBlogEditorsInfoRequest {
  return { identifier: "" };
}

export const GetBlogEditorsInfoRequest = {
  encode(message: GetBlogEditorsInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogEditorsInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogEditorsInfoRequest();
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

  fromJSON(object: any): GetBlogEditorsInfoRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogEditorsInfoRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogEditorsInfoRequest>, I>>(base?: I): GetBlogEditorsInfoRequest {
    return GetBlogEditorsInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogEditorsInfoRequest>, I>>(object: I): GetBlogEditorsInfoRequest {
    const message = createBaseGetBlogEditorsInfoRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogEditorsInfoResponse(): GetBlogEditorsInfoResponse {
  return { editor_count: 0, pending_editor_request_count: 0 };
}

export const GetBlogEditorsInfoResponse = {
  encode(message: GetBlogEditorsInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.editor_count !== 0) {
      writer.uint32(8).uint32(message.editor_count);
    }
    if (message.pending_editor_request_count !== 0) {
      writer.uint32(16).uint32(message.pending_editor_request_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogEditorsInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogEditorsInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.editor_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pending_editor_request_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogEditorsInfoResponse {
    return {
      editor_count: isSet(object.editor_count) ? globalThis.Number(object.editor_count) : 0,
      pending_editor_request_count: isSet(object.pending_editor_request_count)
        ? globalThis.Number(object.pending_editor_request_count)
        : 0,
    };
  },

  toJSON(message: GetBlogEditorsInfoResponse): unknown {
    const obj: any = {};
    if (message.editor_count !== 0) {
      obj.editor_count = Math.round(message.editor_count);
    }
    if (message.pending_editor_request_count !== 0) {
      obj.pending_editor_request_count = Math.round(message.pending_editor_request_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogEditorsInfoResponse>, I>>(base?: I): GetBlogEditorsInfoResponse {
    return GetBlogEditorsInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogEditorsInfoResponse>, I>>(object: I): GetBlogEditorsInfoResponse {
    const message = createBaseGetBlogEditorsInfoResponse();
    message.editor_count = object.editor_count ?? 0;
    message.pending_editor_request_count = object.pending_editor_request_count ?? 0;
    return message;
  },
};

function createBaseGetBlogWritersInfoRequest(): GetBlogWritersInfoRequest {
  return { identifier: "" };
}

export const GetBlogWritersInfoRequest = {
  encode(message: GetBlogWritersInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogWritersInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogWritersInfoRequest();
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

  fromJSON(object: any): GetBlogWritersInfoRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogWritersInfoRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogWritersInfoRequest>, I>>(base?: I): GetBlogWritersInfoRequest {
    return GetBlogWritersInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogWritersInfoRequest>, I>>(object: I): GetBlogWritersInfoRequest {
    const message = createBaseGetBlogWritersInfoRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogWritersInfoResponse(): GetBlogWritersInfoResponse {
  return { writer_count: 0, pending_writer_request_count: 0 };
}

export const GetBlogWritersInfoResponse = {
  encode(message: GetBlogWritersInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.writer_count !== 0) {
      writer.uint32(8).uint32(message.writer_count);
    }
    if (message.pending_writer_request_count !== 0) {
      writer.uint32(16).uint32(message.pending_writer_request_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogWritersInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogWritersInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.writer_count = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.pending_writer_request_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogWritersInfoResponse {
    return {
      writer_count: isSet(object.writer_count) ? globalThis.Number(object.writer_count) : 0,
      pending_writer_request_count: isSet(object.pending_writer_request_count)
        ? globalThis.Number(object.pending_writer_request_count)
        : 0,
    };
  },

  toJSON(message: GetBlogWritersInfoResponse): unknown {
    const obj: any = {};
    if (message.writer_count !== 0) {
      obj.writer_count = Math.round(message.writer_count);
    }
    if (message.pending_writer_request_count !== 0) {
      obj.pending_writer_request_count = Math.round(message.pending_writer_request_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogWritersInfoResponse>, I>>(base?: I): GetBlogWritersInfoResponse {
    return GetBlogWritersInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogWritersInfoResponse>, I>>(object: I): GetBlogWritersInfoResponse {
    const message = createBaseGetBlogWritersInfoResponse();
    message.writer_count = object.writer_count ?? 0;
    message.pending_writer_request_count = object.pending_writer_request_count ?? 0;
    return message;
  },
};

function createBaseGetBlogNewsletterInfoRequest(): GetBlogNewsletterInfoRequest {
  return { identifier: "" };
}

export const GetBlogNewsletterInfoRequest = {
  encode(message: GetBlogNewsletterInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogNewsletterInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogNewsletterInfoRequest();
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

  fromJSON(object: any): GetBlogNewsletterInfoRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogNewsletterInfoRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogNewsletterInfoRequest>, I>>(base?: I): GetBlogNewsletterInfoRequest {
    return GetBlogNewsletterInfoRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogNewsletterInfoRequest>, I>>(object: I): GetBlogNewsletterInfoRequest {
    const message = createBaseGetBlogNewsletterInfoRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogNewsletterInfoResponse(): GetBlogNewsletterInfoResponse {
  return { subscriber_count: 0 };
}

export const GetBlogNewsletterInfoResponse = {
  encode(message: GetBlogNewsletterInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.subscriber_count !== 0) {
      writer.uint32(8).uint32(message.subscriber_count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogNewsletterInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogNewsletterInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.subscriber_count = reader.uint32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogNewsletterInfoResponse {
    return { subscriber_count: isSet(object.subscriber_count) ? globalThis.Number(object.subscriber_count) : 0 };
  },

  toJSON(message: GetBlogNewsletterInfoResponse): unknown {
    const obj: any = {};
    if (message.subscriber_count !== 0) {
      obj.subscriber_count = Math.round(message.subscriber_count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogNewsletterInfoResponse>, I>>(base?: I): GetBlogNewsletterInfoResponse {
    return GetBlogNewsletterInfoResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogNewsletterInfoResponse>, I>>(
    object: I,
  ): GetBlogNewsletterInfoResponse {
    const message = createBaseGetBlogNewsletterInfoResponse();
    message.subscriber_count = object.subscriber_count ?? 0;
    return message;
  },
};

function createBaseGetBlogSitemapRequest(): GetBlogSitemapRequest {
  return { identifier: "" };
}

export const GetBlogSitemapRequest = {
  encode(message: GetBlogSitemapRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogSitemapRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogSitemapRequest();
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

  fromJSON(object: any): GetBlogSitemapRequest {
    return { identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "" };
  },

  toJSON(message: GetBlogSitemapRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogSitemapRequest>, I>>(base?: I): GetBlogSitemapRequest {
    return GetBlogSitemapRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogSitemapRequest>, I>>(object: I): GetBlogSitemapRequest {
    const message = createBaseGetBlogSitemapRequest();
    message.identifier = object.identifier ?? "";
    return message;
  },
};

function createBaseGetBlogSitemapResponse(): GetBlogSitemapResponse {
  return { content: "" };
}

export const GetBlogSitemapResponse = {
  encode(message: GetBlogSitemapResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.content !== "") {
      writer.uint32(10).string(message.content);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogSitemapResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogSitemapResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.content = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogSitemapResponse {
    return { content: isSet(object.content) ? globalThis.String(object.content) : "" };
  },

  toJSON(message: GetBlogSitemapResponse): unknown {
    const obj: any = {};
    if (message.content !== "") {
      obj.content = message.content;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogSitemapResponse>, I>>(base?: I): GetBlogSitemapResponse {
    return GetBlogSitemapResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogSitemapResponse>, I>>(object: I): GetBlogSitemapResponse {
    const message = createBaseGetBlogSitemapResponse();
    message.content = object.content ?? "";
    return message;
  },
};

function createBaseGetBlogNewsletterRequest(): GetBlogNewsletterRequest {
  return { identifier: "", current_user_id: undefined };
}

export const GetBlogNewsletterRequest = {
  encode(message: GetBlogNewsletterRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.identifier !== "") {
      writer.uint32(10).string(message.identifier);
    }
    if (message.current_user_id !== undefined) {
      writer.uint32(18).string(message.current_user_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogNewsletterRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogNewsletterRequest();
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

  fromJSON(object: any): GetBlogNewsletterRequest {
    return {
      identifier: isSet(object.identifier) ? globalThis.String(object.identifier) : "",
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetBlogNewsletterRequest): unknown {
    const obj: any = {};
    if (message.identifier !== "") {
      obj.identifier = message.identifier;
    }
    if (message.current_user_id !== undefined) {
      obj.current_user_id = message.current_user_id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogNewsletterRequest>, I>>(base?: I): GetBlogNewsletterRequest {
    return GetBlogNewsletterRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogNewsletterRequest>, I>>(object: I): GetBlogNewsletterRequest {
    const message = createBaseGetBlogNewsletterRequest();
    message.identifier = object.identifier ?? "";
    message.current_user_id = object.current_user_id ?? undefined;
    return message;
  },
};

function createBaseGetBlogNewsletterResponse(): GetBlogNewsletterResponse {
  return {
    id: "",
    name: "",
    description: undefined,
    newsletter_splash_id: undefined,
    newsletter_splash_hex: undefined,
    user: undefined,
    is_subscribed: false,
  };
}

export const GetBlogNewsletterResponse = {
  encode(message: GetBlogNewsletterResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.description !== undefined) {
      writer.uint32(26).string(message.description);
    }
    if (message.newsletter_splash_id !== undefined) {
      writer.uint32(34).string(message.newsletter_splash_id);
    }
    if (message.newsletter_splash_hex !== undefined) {
      writer.uint32(42).string(message.newsletter_splash_hex);
    }
    if (message.user !== undefined) {
      BareUser.encode(message.user, writer.uint32(50).fork()).ldelim();
    }
    if (message.is_subscribed === true) {
      writer.uint32(56).bool(message.is_subscribed);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetBlogNewsletterResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetBlogNewsletterResponse();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.description = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.newsletter_splash_id = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.newsletter_splash_hex = reader.string();
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.user = BareUser.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.is_subscribed = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetBlogNewsletterResponse {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      description: isSet(object.description) ? globalThis.String(object.description) : undefined,
      newsletter_splash_id: isSet(object.newsletter_splash_id)
        ? globalThis.String(object.newsletter_splash_id)
        : undefined,
      newsletter_splash_hex: isSet(object.newsletter_splash_hex)
        ? globalThis.String(object.newsletter_splash_hex)
        : undefined,
      user: isSet(object.user) ? BareUser.fromJSON(object.user) : undefined,
      is_subscribed: isSet(object.is_subscribed) ? globalThis.Boolean(object.is_subscribed) : false,
    };
  },

  toJSON(message: GetBlogNewsletterResponse): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.description !== undefined) {
      obj.description = message.description;
    }
    if (message.newsletter_splash_id !== undefined) {
      obj.newsletter_splash_id = message.newsletter_splash_id;
    }
    if (message.newsletter_splash_hex !== undefined) {
      obj.newsletter_splash_hex = message.newsletter_splash_hex;
    }
    if (message.user !== undefined) {
      obj.user = BareUser.toJSON(message.user);
    }
    if (message.is_subscribed === true) {
      obj.is_subscribed = message.is_subscribed;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogNewsletterResponse>, I>>(base?: I): GetBlogNewsletterResponse {
    return GetBlogNewsletterResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogNewsletterResponse>, I>>(object: I): GetBlogNewsletterResponse {
    const message = createBaseGetBlogNewsletterResponse();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.description = object.description ?? undefined;
    message.newsletter_splash_id = object.newsletter_splash_id ?? undefined;
    message.newsletter_splash_hex = object.newsletter_splash_hex ?? undefined;
    message.user = (object.user !== undefined && object.user !== null) ? BareUser.fromPartial(object.user) : undefined;
    message.is_subscribed = object.is_subscribed ?? false;
    return message;
  },
};

function createBaseVerifyBlogLoginRequest(): VerifyBlogLoginRequest {
  return { blog_identifier: "", token: "", host: "" };
}

export const VerifyBlogLoginRequest = {
  encode(message: VerifyBlogLoginRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blog_identifier !== "") {
      writer.uint32(10).string(message.blog_identifier);
    }
    if (message.token !== "") {
      writer.uint32(18).string(message.token);
    }
    if (message.host !== "") {
      writer.uint32(26).string(message.host);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyBlogLoginRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyBlogLoginRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.blog_identifier = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.token = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.host = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerifyBlogLoginRequest {
    return {
      blog_identifier: isSet(object.blog_identifier) ? globalThis.String(object.blog_identifier) : "",
      token: isSet(object.token) ? globalThis.String(object.token) : "",
      host: isSet(object.host) ? globalThis.String(object.host) : "",
    };
  },

  toJSON(message: VerifyBlogLoginRequest): unknown {
    const obj: any = {};
    if (message.blog_identifier !== "") {
      obj.blog_identifier = message.blog_identifier;
    }
    if (message.token !== "") {
      obj.token = message.token;
    }
    if (message.host !== "") {
      obj.host = message.host;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyBlogLoginRequest>, I>>(base?: I): VerifyBlogLoginRequest {
    return VerifyBlogLoginRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyBlogLoginRequest>, I>>(object: I): VerifyBlogLoginRequest {
    const message = createBaseVerifyBlogLoginRequest();
    message.blog_identifier = object.blog_identifier ?? "";
    message.token = object.token ?? "";
    message.host = object.host ?? "";
    return message;
  },
};

function createBaseVerifyBlogLoginResponse(): VerifyBlogLoginResponse {
  return { cookie_value: "" };
}

export const VerifyBlogLoginResponse = {
  encode(message: VerifyBlogLoginResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.cookie_value !== "") {
      writer.uint32(10).string(message.cookie_value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerifyBlogLoginResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerifyBlogLoginResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.cookie_value = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerifyBlogLoginResponse {
    return { cookie_value: isSet(object.cookie_value) ? globalThis.String(object.cookie_value) : "" };
  },

  toJSON(message: VerifyBlogLoginResponse): unknown {
    const obj: any = {};
    if (message.cookie_value !== "") {
      obj.cookie_value = message.cookie_value;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<VerifyBlogLoginResponse>, I>>(base?: I): VerifyBlogLoginResponse {
    return VerifyBlogLoginResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<VerifyBlogLoginResponse>, I>>(object: I): VerifyBlogLoginResponse {
    const message = createBaseVerifyBlogLoginResponse();
    message.cookie_value = object.cookie_value ?? "";
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
