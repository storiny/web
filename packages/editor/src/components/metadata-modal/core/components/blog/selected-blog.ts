import { Blog } from "@storiny/types";
import { atom } from "jotai";

export const selected_blog_atom = atom<Blog | null | undefined>(undefined);
