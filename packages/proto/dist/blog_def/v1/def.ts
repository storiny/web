/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "blog_def.v1";

export interface BareBlog {
  id: string;
  slug: string;
  domain?: string | undefined;
  name: string;
}

export interface LeftSidebarItem {
  id: string;
  name: string;
  icon?: string | undefined;
  priority: number;
  target: string;
}

export interface RightSidebarItem {
  id: string;
  primary_text: string;
  secondary_text?: string | undefined;
  icon?: string | undefined;
  priority: number;
  target: string;
}

export interface GetBlogRequest {
  slug: string;
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
  /** Connections */
  website_url?: string | undefined;
  public_email?: string | undefined;
  github_id?: string | undefined;
  instagram_id?: string | undefined;
  linkedin_id?: string | undefined;
  youtube_id?: string | undefined;
  twitter_id?: string | undefined;
  twitch_id?:
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
  slug: string;
}

export interface GetBlogArchiveResponse {
  story_count: number;
  timeline: ArchiveTimeline[];
}

function createBaseBareBlog(): BareBlog {
  return { id: "", slug: "", domain: undefined, name: "" };
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
    return message;
  },
};

function createBaseLeftSidebarItem(): LeftSidebarItem {
  return { id: "", name: "", icon: undefined, priority: 0, target: "" };
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
    if (message.priority !== 0) {
      writer.uint32(32).uint32(message.priority);
    }
    if (message.target !== "") {
      writer.uint32(42).string(message.target);
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
          if (tag !== 32) {
            break;
          }

          message.priority = reader.uint32();
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

  fromJSON(object: any): LeftSidebarItem {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      icon: isSet(object.icon) ? globalThis.String(object.icon) : undefined,
      priority: isSet(object.priority) ? globalThis.Number(object.priority) : 0,
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
    if (message.priority !== 0) {
      obj.priority = Math.round(message.priority);
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
    message.priority = object.priority ?? 0;
    message.target = object.target ?? "";
    return message;
  },
};

function createBaseRightSidebarItem(): RightSidebarItem {
  return { id: "", primary_text: "", secondary_text: undefined, icon: undefined, priority: 0, target: "" };
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
    if (message.priority !== 0) {
      writer.uint32(40).uint32(message.priority);
    }
    if (message.target !== "") {
      writer.uint32(50).string(message.target);
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
          if (tag !== 40) {
            break;
          }

          message.priority = reader.uint32();
          continue;
        case 6:
          if (tag !== 50) {
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
      priority: isSet(object.priority) ? globalThis.Number(object.priority) : 0,
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
    if (message.priority !== 0) {
      obj.priority = Math.round(message.priority);
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
    message.priority = object.priority ?? 0;
    message.target = object.target ?? "";
    return message;
  },
};

function createBaseGetBlogRequest(): GetBlogRequest {
  return { slug: "", current_user_id: undefined };
}

export const GetBlogRequest = {
  encode(message: GetBlogRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slug !== "") {
      writer.uint32(10).string(message.slug);
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

          message.slug = reader.string();
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
      slug: isSet(object.slug) ? globalThis.String(object.slug) : "",
      current_user_id: isSet(object.current_user_id) ? globalThis.String(object.current_user_id) : undefined,
    };
  },

  toJSON(message: GetBlogRequest): unknown {
    const obj: any = {};
    if (message.slug !== "") {
      obj.slug = message.slug;
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
    message.slug = object.slug ?? "";
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
    website_url: undefined,
    public_email: undefined,
    github_id: undefined,
    instagram_id: undefined,
    linkedin_id: undefined,
    youtube_id: undefined,
    twitter_id: undefined,
    twitch_id: undefined,
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
    if (message.website_url !== undefined) {
      writer.uint32(234).string(message.website_url);
    }
    if (message.public_email !== undefined) {
      writer.uint32(242).string(message.public_email);
    }
    if (message.github_id !== undefined) {
      writer.uint32(250).string(message.github_id);
    }
    if (message.instagram_id !== undefined) {
      writer.uint32(258).string(message.instagram_id);
    }
    if (message.linkedin_id !== undefined) {
      writer.uint32(266).string(message.linkedin_id);
    }
    if (message.youtube_id !== undefined) {
      writer.uint32(274).string(message.youtube_id);
    }
    if (message.twitter_id !== undefined) {
      writer.uint32(282).string(message.twitter_id);
    }
    if (message.twitch_id !== undefined) {
      writer.uint32(290).string(message.twitch_id);
    }
    if (message.domain !== undefined) {
      writer.uint32(298).string(message.domain);
    }
    if (message.created_at !== "") {
      writer.uint32(306).string(message.created_at);
    }
    if (message.category !== "") {
      writer.uint32(314).string(message.category);
    }
    if (message.user_id !== "") {
      writer.uint32(322).string(message.user_id);
    }
    if (message.rsb_items_label !== "") {
      writer.uint32(330).string(message.rsb_items_label);
    }
    for (const v of message.lsb_items) {
      LeftSidebarItem.encode(v!, writer.uint32(338).fork()).ldelim();
    }
    for (const v of message.rsb_items) {
      RightSidebarItem.encode(v!, writer.uint32(346).fork()).ldelim();
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
          if (tag !== 234) {
            break;
          }

          message.website_url = reader.string();
          continue;
        case 30:
          if (tag !== 242) {
            break;
          }

          message.public_email = reader.string();
          continue;
        case 31:
          if (tag !== 250) {
            break;
          }

          message.github_id = reader.string();
          continue;
        case 32:
          if (tag !== 258) {
            break;
          }

          message.instagram_id = reader.string();
          continue;
        case 33:
          if (tag !== 266) {
            break;
          }

          message.linkedin_id = reader.string();
          continue;
        case 34:
          if (tag !== 274) {
            break;
          }

          message.youtube_id = reader.string();
          continue;
        case 35:
          if (tag !== 282) {
            break;
          }

          message.twitter_id = reader.string();
          continue;
        case 36:
          if (tag !== 290) {
            break;
          }

          message.twitch_id = reader.string();
          continue;
        case 37:
          if (tag !== 298) {
            break;
          }

          message.domain = reader.string();
          continue;
        case 38:
          if (tag !== 306) {
            break;
          }

          message.created_at = reader.string();
          continue;
        case 39:
          if (tag !== 314) {
            break;
          }

          message.category = reader.string();
          continue;
        case 40:
          if (tag !== 322) {
            break;
          }

          message.user_id = reader.string();
          continue;
        case 41:
          if (tag !== 330) {
            break;
          }

          message.rsb_items_label = reader.string();
          continue;
        case 42:
          if (tag !== 338) {
            break;
          }

          message.lsb_items.push(LeftSidebarItem.decode(reader, reader.uint32()));
          continue;
        case 43:
          if (tag !== 346) {
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
      website_url: isSet(object.website_url) ? globalThis.String(object.website_url) : undefined,
      public_email: isSet(object.public_email) ? globalThis.String(object.public_email) : undefined,
      github_id: isSet(object.github_id) ? globalThis.String(object.github_id) : undefined,
      instagram_id: isSet(object.instagram_id) ? globalThis.String(object.instagram_id) : undefined,
      linkedin_id: isSet(object.linkedin_id) ? globalThis.String(object.linkedin_id) : undefined,
      youtube_id: isSet(object.youtube_id) ? globalThis.String(object.youtube_id) : undefined,
      twitter_id: isSet(object.twitter_id) ? globalThis.String(object.twitter_id) : undefined,
      twitch_id: isSet(object.twitch_id) ? globalThis.String(object.twitch_id) : undefined,
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
    if (message.website_url !== undefined) {
      obj.website_url = message.website_url;
    }
    if (message.public_email !== undefined) {
      obj.public_email = message.public_email;
    }
    if (message.github_id !== undefined) {
      obj.github_id = message.github_id;
    }
    if (message.instagram_id !== undefined) {
      obj.instagram_id = message.instagram_id;
    }
    if (message.linkedin_id !== undefined) {
      obj.linkedin_id = message.linkedin_id;
    }
    if (message.youtube_id !== undefined) {
      obj.youtube_id = message.youtube_id;
    }
    if (message.twitter_id !== undefined) {
      obj.twitter_id = message.twitter_id;
    }
    if (message.twitch_id !== undefined) {
      obj.twitch_id = message.twitch_id;
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
    message.website_url = object.website_url ?? undefined;
    message.public_email = object.public_email ?? undefined;
    message.github_id = object.github_id ?? undefined;
    message.instagram_id = object.instagram_id ?? undefined;
    message.linkedin_id = object.linkedin_id ?? undefined;
    message.youtube_id = object.youtube_id ?? undefined;
    message.twitter_id = object.twitter_id ?? undefined;
    message.twitch_id = object.twitch_id ?? undefined;
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
  return { slug: "" };
}

export const GetBlogArchiveRequest = {
  encode(message: GetBlogArchiveRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.slug !== "") {
      writer.uint32(10).string(message.slug);
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

          message.slug = reader.string();
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
    return { slug: isSet(object.slug) ? globalThis.String(object.slug) : "" };
  },

  toJSON(message: GetBlogArchiveRequest): unknown {
    const obj: any = {};
    if (message.slug !== "") {
      obj.slug = message.slug;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetBlogArchiveRequest>, I>>(base?: I): GetBlogArchiveRequest {
    return GetBlogArchiveRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<GetBlogArchiveRequest>, I>>(object: I): GetBlogArchiveRequest {
    const message = createBaseGetBlogArchiveRequest();
    message.slug = object.slug ?? "";
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
