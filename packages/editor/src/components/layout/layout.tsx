"use client";

import { Provider } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Main from "~/components/main";
import BlogLeftSidebar from "~/layout/blog-left-sidebar";
import BlogNavbar from "~/layout/blog-navbar";
import Navbar from "~/layout/navbar";

import EditorComposer from "../composer";
import { EditorProps } from "../editor";
import HydrateMetadata from "../hydrate-metadata";
import EditorLeftSidebar from "./left-sidebar";
import EditorNavbar from "./navbar";
import EditorRightSidebar from "./right-sidebar";

const EditorToolbar = dynamic(() => import("../toolbar"));
const StoryMetadataBar = dynamic(() => import("../metadata-bar"));

const EditorLayout = ({
  children,
  read_only,
  story,
  status = "draft",
  role,
  is_writer
}: {
  children: React.ReactNode;
} & Pick<
  EditorProps,
  "read_only" | "story" | "status" | "role" | "is_writer"
>): React.ReactElement => {
  const blog = use_blog_context();

  return (
    <Provider>
      <HydrateMetadata is_writer={Boolean(is_writer)} role={role} story={story}>
        <EditorComposer
          read_only={status === "deleted" || read_only || role === "viewer"}
        >
          <React.Fragment>
            {read_only ? (
              blog?.id ? (
                <BlogNavbar />
              ) : (
                <Navbar />
              )
            ) : (
              <EditorNavbar status={status} />
            )}
            {Boolean(blog?.id) && read_only ? (
              <BlogLeftSidebar />
            ) : (
              <EditorLeftSidebar read_only={read_only} status={status} />
            )}
            <Main data-editor={"true"}>
              {status !== "deleted" && !read_only ? <StoryMetadataBar /> : null}
              {children}
              {status !== "deleted" && !read_only ? <EditorToolbar /> : null}
            </Main>
            <EditorRightSidebar read_only={read_only} status={status} />
          </React.Fragment>
        </EditorComposer>
      </HydrateMetadata>
    </Provider>
  );
};

export default EditorLayout;
