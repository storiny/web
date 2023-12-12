"use client";

import { User } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";

import { GetCommentResponse } from "~/common/grpc";
import Spacer from "~/components/spacer";
import Comment from "~/entities/comment";
import PageTitle from "~/entities/page-title";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./styles.module.scss";

type Props = GetCommentResponse;

const Page = (props: Props): React.ReactElement => {
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));

  return (
    <React.Fragment>
      {is_smaller_than_tablet && (
        <React.Fragment>
          <PageTitle
            back_button_href={`/${props.story_writer_username}/${props.story_slug}`}
          >
            Viewing comment
          </PageTitle>
          <Spacer orientation={"vertical"} />
        </React.Fragment>
      )}
      <Comment
        className={clsx(styles.x, styles.comment)}
        comment={{
          ...props,
          edited_at: props.edited_at || null,
          user: props.user as User | undefined
        }}
        hide_hidden_overlay
      />
    </React.Fragment>
  );
};

export default Page;
