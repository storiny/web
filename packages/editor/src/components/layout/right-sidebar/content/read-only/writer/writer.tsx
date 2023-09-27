import { User } from "@storiny/types";
import { useAtomValue } from "jotai";
import React from "react";

import Button from "~/components/Button";
import IconButton from "~/components/IconButton";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import Status from "~/entities/Status";
import MailPlusIcon from "~/icons/mail-plus";
import UserCheckIcon from "~/icons/UserCheck";
import UserPlusIcon from "~/icons/UserPlus";
import { boolean_action, setFollowing } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import { storyMetadataAtom } from "../../../../../../atoms";

const StoryActions = ({ user }: { user: User }): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const isFollowing = use_app_selector(
    (state) => state.entities.following[user.id]
  );

  return (
    <div className={"flex"}>
      <Button
        checkAuth
        className={"fit-w"}
        decorator={isFollowing ? <UserCheckIcon /> : <UserPlusIcon />}
        onClick={(): void => {
          dispatch(boolean_action("following", user.id));
        }}
        variant={isFollowing ? "hollow" : "rigid"}
      >
        {isFollowing ? "Following" : "Follow"}
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
  const story = useAtomValue(storyMetadataAtom);
  const user = story.user!;
  const followerCount =
    use_app_selector((state) => state.entities.followerCounts[user.id]) || 0;

  return (
    <div className={"flex-col"}>
      <Persona
        avatar={{
          alt: `${user?.name}'s avatar`,
          avatarId: user?.avatar_id,
          label: user?.name,
          hex: user?.avatar_hex
        }}
        className={"fit-w"}
        component_props={{
          secondaryText: {
            ellipsis: true
          }
        }}
        primaryText={
          <Link ellipsis fixedColor href={`/${user.username}`}>
            {user.name}
          </Link>
        }
        secondaryText={
          <>
            @{user.username} &bull; {abbreviateNumber(followerCount)}{" "}
            {followerCount === 1 ? "follower" : "followers"}
          </>
        }
        size={"lg"}
      />
      {user.status && (
        <React.Fragment>
          <Spacer orientation={"vertical"} size={2} />
          <Status
            emoji={user.status.emoji ?? undefined}
            expiresAt={user.status.expires_at ?? undefined}
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
