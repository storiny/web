import { CompileOptions } from "@mdx-js/mdx";
import rehype_slug from "rehype-slug";
import remark_gfm from "remark-gfm";

export const mdx_config: CompileOptions = {
  providerImportSource: "@mdx-js/react",
  remarkPlugins: [remark_gfm],
  rehypePlugins: [rehype_slug]
};
