import React from "react";

import CustomState from "../../../../../../packages/ui/src/entities/custom-state";

interface ProfileEmptyStateProps {
  entityType: "stories" | "followers" | "following" | "friends";
  query: string;
  username: string;
}

/**
 * Empty state title
 */
const entityTypeToTitleMap: Record<
  ProfileEmptyStateProps["entityType"],
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
const entityTypeToDescriptionMap = (
  username: string
): Record<ProfileEmptyStateProps["entityType"], React.ReactNode> => ({
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
  entityType
}: ProfileEmptyStateProps): React.ReactElement => (
  <CustomState
    auto_size
    description={
      query
        ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
        : entityTypeToDescriptionMap(username)[entityType]
    }
    title={
      query
        ? `Could not find any ${
            entityType === "stories" ? "story" : "user"
          } for "${query}"`
        : entityTypeToTitleMap[entityType]
    }
  />
);

export default ProfileEmptyState;
