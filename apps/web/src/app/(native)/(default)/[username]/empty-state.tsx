import React from "react";

import CustomState from "~/entities/custom-state";
import css from "~/theme/main.module.scss";

interface ProfileEmptyStateProps {
  entity_type: "stories" | "followers" | "following" | "friends";
  query: string;
  username: string;
}

/**
 * Empty state title
 */
const ENTITY_TYPE_TITLE_MAP: Record<
  ProfileEmptyStateProps["entity_type"],
  string
> = {
  following: "No following users",
  followers: "No followers",
  friends: "No friends",
  stories: "No stories published yet"
};

/**
 * Empty state description
 * @param username
 */
const get_entity_description_map = (
  username: string
): Record<ProfileEmptyStateProps["entity_type"], React.ReactNode> => ({
  following: (
    <>
      Users followed by <span className={css["t-medium"]}>@{username}</span>{" "}
      will show up here.
    </>
  ),
  followers: (
    <>
      <span className={css["t-medium"]}>@{username}</span>&apos;s followers will
      show up here.
    </>
  ),
  friends: (
    <>
      <span className={css["t-medium"]}>@{username}</span>&apos;s friends will
      show up here.
    </>
  ),
  stories: (
    <>
      Public stories posted by{" "}
      <span className={css["t-medium"]}>@{username}</span> will show up here.
    </>
  )
});

const ProfileEmptyState = ({
  query,
  username,
  entity_type
}: ProfileEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : get_entity_description_map(username)[entity_type]
    }
    title={
      query
        ? `Could not find any ${
            entity_type === "stories" ? "story" : "user"
          } for "${query}"`
        : ENTITY_TYPE_TITLE_MAP[entity_type]
    }
  />
);

export default ProfileEmptyState;
