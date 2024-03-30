// robots.txt endpoint

export const GET = (
  _: Request,
  { params }: { params: { slug: string } }
): Response => {
  const { slug } = params;
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

Sitemap: https://${slug}.storiny.com/sitemap.xml
`;

  return new Response(value, {
    status: 200
  });
};
