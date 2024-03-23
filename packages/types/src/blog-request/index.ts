import { Blog } from "../blog";

export type BlogRequest = {
  blog: Blog;
  created_at: string;
  id: string;
  role: "editor" | "writer";
};
