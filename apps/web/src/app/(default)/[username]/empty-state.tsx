import React from "react";

import CustomState from "../../../../../../packages/ui/src/entities/custom-state";

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
      Users followed by <span className={"t-medium"}>@{username}</span> will
      appear here.
    </>
  ),
  followers: (
    <>
      <span className={"t-medium"}>@{username}</span>&apos;s followers will
      appear here.
    </>
  ),
  friends: (
    <>
      <span className={"t-medium"}>@{username}</span>&apos;s friends will appear
      here.
    </>
  ),
  stories: (
    <>
      Public stories posted by <span className={"t-medium"}>@{username}</span>{" "}
      will appear here as soon as they are published.
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
