import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { Blog } from "@storiny/types";
import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import { use_form_context } from "~/components/form";
import IconButton from "~/components/icon-button";
import Spacer from "~/components/spacer";
import Persona from "~/entities/persona";
import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";

import { StoryMetadataSchema } from "../../../schema";
import styles from "./blog.module.scss";
import { selected_blog_atom } from "./selected-blog";

const BlogItem = ({
  blog,
  className,
  ...rest
}: {
  blog: Blog;
} & React.ComponentPropsWithoutRef<"div">): React.ReactElement => {
  const set_selected_blog = use_set_atom(selected_blog_atom);
  const form = use_form_context<StoryMetadataSchema>();
  const blog_id = form.watch("blog_id");
  const is_selected = blog_id === blog.id;

  return (
    <div
      {...rest}
      className={clsx(
        css["flex-center"],
        css["full-w"],
        styles.x,
        styles.item,
        is_selected && styles.selected,
        !blog.is_active && styles.inactive,
        className
      )}
    >
      <Persona
        aria-disabled={!blog.is_active}
        avatar={{
          alt: "",
          avatar_id: blog.logo_id,
          label: blog.name,
          hex: blog.logo_hex,
          className: clsx(styles.x, styles.logo),
          slot_props: {
            fallback: {
              className: clsx(styles.x, styles.fallback)
            }
          }
        }}
        className={clsx(
          styles.x,
          styles.persona,
          is_selected && styles.selected,
          !blog.is_active && styles.inactive
        )}
        component_props={{
          primary_text: {
            className: css["ellipsis"]
          },
          secondary_text: {
            className: css["ellipsis"]
          }
        }}
        onClick={(): void => {
          if (blog.is_active) {
            set_selected_blog(blog);

            form.setValue("blog_id", blog.id, {
              shouldDirty: true
            });
          }
        }}
        primary_text={blog.name}
        role={"button"}
        secondary_text={get_blog_url(blog).replace("https://", "")}
      />
      {is_selected && (
        <React.Fragment>
          <Spacer />
          <IconButton
            aria-label={"Remove from this blog"}
            onClick={(): void => {
              set_selected_blog(null);

              form.setValue("blog_id", null, {
                shouldDirty: true
              });
            }}
            title={"Remove from this blog"}
            variant={"ghost"}
          >
            <XIcon />
          </IconButton>
        </React.Fragment>
      )}
    </div>
  );
};

export default BlogItem;
