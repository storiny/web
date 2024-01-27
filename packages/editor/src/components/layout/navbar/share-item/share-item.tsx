import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import SuspenseLoader from "~/common/suspense-loader";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Input from "~/components/input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Option from "~/components/option";
import ScrollArea from "~/components/scroll-area";
import Select from "~/components/select";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import { use_media_query } from "~/hooks/use-media-query";
import AtIcon from "~/icons/at";
import SendIcon from "~/icons/send";
import {
  get_query_error_type,
  get_story_contributors_api,
  use_get_story_contributors_query,
  use_invite_contributor_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { story_metadata_atom } from "../../../../atoms";
import Contributor from "./contributor";
import styles from "./share-item.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamic_loader()
});

const ModalActions = (): React.ReactElement => {
  const toast = use_toast();
  const story = use_atom_value(story_metadata_atom);
  const dispatch = use_app_dispatch();
  const [username, set_username] = React.useState<string>("");
  const [role, set_role] = React.useState<string>("viewer");
  const [invite_contributor, { isLoading: is_loading }] =
    use_invite_contributor_mutation();

  const handle_invite = (): void => {
    invite_contributor({
      username,
      story_id: story.id,
      role: role as "editor" | "viewer"
    })
      .unwrap()
      .then(() => {
        set_username("");
        toast("Invite sent", "success");
        dispatch(get_story_contributors_api.util.resetApiState());
      })
      .catch((error) => {
        handle_api_error(error, toast, null, "Could not invite the user");
      });
  };

  return (
    <div className={clsx(css["flex-center"], styles.actions)}>
      <Input
        aria-label={"Invite contributors"}
        decorator={<AtIcon />}
        end_decorator={
          <Select
            onValueChange={(next_role): void => set_role(next_role)}
            slot_props={{
              content: {
                style: {
                  zIndex: "calc(var(--z-index-popover) + 1)"
                }
              },
              value: { placeholder: "Role" },
              trigger: {
                "aria-label": "Change contributor role"
              }
            }}
            value={role}
          >
            <Option value={"viewer"}>can view</Option>
            <Option value={"editor"}>can edit</Option>
          </Select>
        }
        maxLength={USER_PROPS.username.max_length}
        minLength={USER_PROPS.username.min_length}
        onChange={(event): void => set_username(event.target.value)}
        placeholder={"Enter username"}
        slot_props={{
          container: { className: css["f-grow"] }
        }}
        value={username}
      />
      <Button
        className={clsx(styles.x, styles.button)}
        disabled={
          (!username || username.length < USER_PROPS.username.min_length) &&
          !is_loading
        }
        loading={is_loading}
        onClick={handle_invite}
      >
        Invite
      </Button>
    </div>
  );
};

// Modal

const ShareItemModal = (): React.ReactElement => {
  const story = use_atom_value(story_metadata_atom);
  const {
    data = [],
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = use_get_story_contributors_query({
    story_id: story.id
  });

  return (
    <React.Fragment>
      <Description asChild>
        <Typography className={css["t-minor"]} level={"body2"}>
          You can invite users to contribute to this story. Their edits will be
          credited, and their names will be displayed publicly alongside the
          story until you remove them.
        </Typography>
      </Description>
      <Spacer orientation={"vertical"} size={1.5} />
      <ModalActions />
      <Spacer orientation={"vertical"} size={1.5} />
      <Divider />
      <Spacer orientation={"vertical"} size={1.5} />
      <div className={clsx(css["flex"], styles.content)}>
        <ScrollArea
          className={clsx(styles.x, styles["scroll-area"])}
          slot_props={{
            viewport: {
              className: clsx(styles.x, styles.viewport)
            }
          }}
          type={"hover"}
        >
          {is_loading || is_fetching ? (
            <SuspenseLoader />
          ) : is_error ? (
            <ErrorState
              component_props={{
                button: { loading: is_fetching }
              }}
              retry={refetch}
              size={"sm"}
              type={get_query_error_type(error)}
            />
          ) : !is_fetching && !data.length ? (
            <EmptyState />
          ) : (
            data.map((contributor) => (
              <Contributor {...contributor} key={contributor.id} />
            ))
          )}
        </ScrollArea>
      </div>
    </React.Fragment>
  );
};

const ShareItem = ({ disabled }: { disabled: boolean }): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        check_auth
        disabled={disabled}
        onClick={open_modal}
        variant={"hollow"}
      >
        Share
      </Button>
    ),
    <ShareItemModal />,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile}>
            Done
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "480px"
          }
        },
        header: {
          decorator: <SendIcon />,
          children: "Share story"
        }
      }
    }
  );

  return element;
};

export default ShareItem;
