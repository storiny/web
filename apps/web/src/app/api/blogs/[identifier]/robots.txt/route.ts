// robots.txt endpoint

import { is_valid_blog_identifier } from "~/common/utils/is-valid-blog-identifier";

export const GET = (
  _: Request,
  { params }: { params: { identifier: string } }
): Response => {
  const { identifier } = params;

  if (!is_valid_blog_identifier(identifier)) {
    return new Response("Invalid blog identifier", { status: 400 });
  }

  const blog_url = identifier.includes(".")
    ? `https://${identifier}`
    : `https://${identifier}.storiny.com`;

  const value = `
User-agent: *
Disallow: /handler$
Disallow: /api/

User-agent: Mediapartners-Google
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

Sitemap: ${blog_url}/sitemap.xml
`;

  return new Response(value, {
    status: 200
  });
};
