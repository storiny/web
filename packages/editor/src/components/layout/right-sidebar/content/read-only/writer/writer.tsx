import { User } from "@storiny/types";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "../../../../../../../../ui/src/components/button";
import IconButton from "../../../../../../../../ui/src/components/icon-button";
import Link from "../../../../../../../../ui/src/components/link";
import Spacer from "../../../../../../../../ui/src/components/spacer";
import Tooltip from "../../../../../../../../ui/src/components/tooltip";
import Typography from "../../../../../../../../ui/src/components/typography";
import Persona from "../../../../../../../../ui/src/entities/persona";
import Status from "../../../../../../../../ui/src/entities/status";
import MailPlusIcon from "~/icons/mail-plus";
import UserCheckIcon from "../../../../../../../../ui/src/icons/user-check";
import UserPlusIcon from "../../../../../../../../ui/src/icons/user-plus";
import { boolean_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { story_metadata_atom } from "../../../../../../atoms";

const StoryActions = ({ user }: { user: User }): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const is_following = use_app_selector(
    (state) => state.entities.following[user.id]
  );

  return (
    <div className={"flex"}>
      <Button
        check_auth
        className={"fit-w"}
        decorator={is_following ? <UserCheckIcon /> : <UserPlusIcon />}
        onClick={(): void => {
          dispatch(boolean_action("following", user.id));
        }}
        variant={is_following ? "hollow" : "rigid"}
      >
        {is_following ? "Following" : "Follow"}
      </Button>
      <Spacer />
      {/* TODO: Implement */}
      <Tooltip content={"Available soon"}>
        <div>
          <IconButton
            aria-label={"Subscribe to newsletter"}
            disabled
            title={"Subscribe to newsletter"}
          >
            <MailPlusIcon />
          </IconButton>
        </div>
      </Tooltip>
    </div>
  );
};

const StoryWriter = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const user = story.user!;
  const follower_count =
    use_app_selector((state) => state.entities.follower_counts[user.id]) || 0;

  return (
    <div className={"flex-col"}>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatar_id: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        className={"fit-w"}
        component_props={{
          secondary_text: {
            ellipsis: true
          }
        }}
        primary_text={
          <Link ellipsis fixed_color href={`/${user.username}`}>
            {user.name}
          </Link>
        }
        secondary_text={
          <>
            @{user.username} &bull; {abbreviate_number(follower_count)}{" "}
            {follower_count === 1 ? "follower" : "followers"}
          </>
        }
        size={"lg"}
      />
      {user.status && (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={2} />
          <Status
            emoji={user.status.emoji ?? undefined}
            expires_at={user.status.expires_at ?? undefined}
            text={user.status.text ?? undefined}
          />
        </React.Fragment>
      )}
      {user.bio.trim() ? (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={2} />
          <Typography className={"t-minor"} level={"body2"}>
            {user.bio}
          </Typography>
        </React.Fragment>
      ) : null}
      <Spacer orientation={"vertical"} size={3} />
      <StoryActions user={user} />
    </div>
  );
};

export default StoryWriter;
