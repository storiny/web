import remarkGfm from "remark-gfm";

/** @type {import('@mdx-js/mdx').CompileOptions} */
export const mdxConfig = {
  providerImportSource: "@mdx-js/react",
  remarkPlugins: [remarkGfm],
  rehypePlugins: []
};
