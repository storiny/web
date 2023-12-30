/* eslint-disable prefer-snakecase/prefer-snakecase */

import rehype_slug from "rehype-slug";
import remark_gfm from "remark-gfm";

/** @type {import('@mdx-js/mdx').CompileOptions} */
export const mdx_config = {
  providerImportSource: "@mdx-js/react",
  remarkPlugins: [remark_gfm],
  rehypePlugins: [rehype_slug]
};
