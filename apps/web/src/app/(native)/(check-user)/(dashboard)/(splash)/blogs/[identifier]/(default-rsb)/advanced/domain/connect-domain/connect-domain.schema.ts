import { BLOG_SCHEMA } from "@storiny/shared";
import { z } from "zod";

export type ConnectDomainSchema = z.infer<typeof CONNECT_DOMAIN_SCHEMA>;

export const CONNECT_DOMAIN_SCHEMA = z.object({
  domain: BLOG_SCHEMA.domain
});
