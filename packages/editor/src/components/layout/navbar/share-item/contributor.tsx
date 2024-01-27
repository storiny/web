import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Option from "~/components/option";
import Select from "~/components/select";
import { use_toast } from "~/components/toast";
import Persona from "~/entities/persona";
import UserIcon from "~/icons/user";
import UserXIcon from "~/icons/user-x";
import {
  get_story_contributors_api,
  GetStoryContributorsResponse,
  use_cancel_collaboration_request_mutation,
  use_remove_contributor_mutation,
  use_update_contributor_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";
import { truncate } from "~/utils/truncate";

import { story_metadata_atom } from "../../../../atoms";
import styles from "./share-item.module.scss";

const Contributor = (
  props: GetStoryContributorsResponse[number]
): React.ReactElement => {
  const { id, user, user_id, has_accepted, role } = props;
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const story = use_atom_value(story_metadata_atom);
  const [remove_contributor, { isLoading: is_remove_loading }] =
    use_remove_contributor_mutation();
  const [update_contributor, { isLoading: is_update_loading }] =
    use_update_contributor_mutation();
  const [cancel_request, { isLoading: is_cancel_loading }] =
    use_cancel_collaboration_request_mutation();

  /**
   * Updates the contributor's role
   * @param next_role The next role for the contributor
   */
  const handle_update = (next_role: string): void => {
    update_contributor({
      user_id,
      story_id: story.id,
      role: next_role as "editor" | "viewer"
    })
      .unwrap()
      .then(() => {
        toast("Role updated", "success");
        dispatch(get_story_contributors_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not update the role")
      );
  };

  /**
   * Removes a contributor
   */
  const handle_remove = (): void => {
    remove_contributor({ user_id, story_id: story.id })
      .unwrap()
      .then(() => {
        toast("Contributor removed", "success");
        dispatch(get_story_contributors_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the contributor")
      );
  };

  /**
   * Cancels the collaboration request
   */
  const handle_cancel = (): void => {
    cancel_request({ id })
      .unwrap()
      .then(() => {
        toast("Request cancelled", "success");
        dispatch(get_story_contributors_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not cancel the request")
      );
  };

  return (
    <div
      className={clsx(css["flex-center"], css["full-w"], styles.contributor)}
    >
      <Persona
        avatar={
          user === null
            ? {
                children: <UserIcon />,
                className: styles.avatar
              }
            : {
                alt: `${user.name}'s avatar`,
                avatar_id: user.avatar_id,
                label: user.name,
                hex: user.avatar_hex
              }
        }
        component_props={{
          secondary_text: {
            className: css["ellipsis"]
          }
        }}
        primary_text={
          user === null ? (
            "Deleted user"
          ) : (
            <Link
              ellipsis
              fixed_color
              href={`/${user.username}`}
              target={"_blank"}
            >
              {truncate(user.name, 96)}
            </Link>
          )
        }
        secondary_text={
          <React.Fragment>
            {user === null ? (
              "Pending"
            ) : (
              <>
                @{user.username}
                {!has_accepted && <> &bull; Pending</>}
              </>
            )}
          </React.Fragment>
        }
      />
      <Grow />
      {has_accepted ? (
        <div
          className={clsx(css["flex-center"], styles["contributor-actions"])}
        >
          <Select
            disabled={is_update_loading || is_remove_loading}
            onValueChange={(next_role): void => handle_update(next_role)}
            size={"sm"}
            slot_props={{
              content: {
                style: {
                  zIndex: "calc(var(--z-index-popover) + 1)"
                }
              },
              value: { placeholder: "Role" },
              trigger: {
                style: { height: "30px" },
                "aria-label": "Change contributor role"
              }
            }}
            value={role}
          >
            <Option value={"viewer"}>can view</Option>
            <Option value={"editor"}>can edit</Option>
          </Select>
          <IconButton
            aria-label={"Remove this contributor"}
            check_auth
            disabled={is_update_loading}
            loading={is_remove_loading}
            onClick={handle_remove}
            title={"Remove this contributor"}
            variant={"ghost"}
          >
            <UserXIcon />
          </IconButton>
        </div>
      ) : (
        <Button
          check_auth
          loading={is_cancel_loading}
          onClick={handle_cancel}
          variant={"hollow"}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

export default Contributor;
