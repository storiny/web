"use client";

import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import { UserListSkeleton, VirtualizedUserList } from "~/common/user";
import Divider from "../../../../../../../../../../../packages/ui/src/components/divider";
import Input from "../../../../../../../../../../../packages/ui/src/components/input";
import Option from "../../../../../../../../../../../packages/ui/src/components/option";
import Select from "../../../../../../../../../../../packages/ui/src/components/select";
import Spacer from "../../../../../../../../../../../packages/ui/src/components/spacer";
import Typography from "../../../../../../../../../../../packages/ui/src/components/typography";
import ErrorState from "../../../../../../../../../../../packages/ui/src/entities/error-state";
import { use_debounce } from "../../../../../../../../../../../packages/ui/src/hooks/use-debounce";
import SearchIcon from "~/icons/Search";
import {
  get_query_error_type,
  self_action,
  use_get_muted_users_query
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "../../../../../../../../../../../packages/ui/src/utils/abbreviate-number";

import DashboardTitle from "../../dashboard-title";
import { MutesProps } from "./mutes.props";
import ModerationMutesRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const EmptyState = dynamic(() => import("./empty-state"), {
  loading: dynamicLoader()
});

export type MutesSortValue = "recent" | "old";

// Status header

const StatusHeader = ({ mute_count }: MutesProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const muteCount =
    use_app_selector((state) => state.entities.self_mute_count) || 0;

  React.useEffect(() => {
    dispatch(self_action("self_mute_count", mute_count));
  }, [dispatch, mute_count]);

  return (
    <div
      className={clsx(
        "full-bleed",
        "dashboard-header",
        "flex-center",
        styles.x,
        styles["status-header"]
      )}
    >
      <Typography ellipsis level={"body2"}>
        {muteCount === 0 ? (
          "You have not muted anyone yet."
        ) : (
          <>
            You have muted{" "}
            <span className={"t-bold"}>{abbreviate_number(muteCount)}</span>{" "}
            {muteCount === 1 ? "user" : "users"}.
          </>
        )}
      </Typography>
    </div>
  );
};

// Control bar

const ControlBar = ({
  query,
  sort,
  onSortChange,
  onQueryChange,
  disabled
}: {
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  onSortChange: (newSort: MutesSortValue) => void;
  query: string;
  sort: MutesSortValue;
}): React.ReactElement => (
  <div
    className={clsx(
      "flex-center",
      "full-bleed",
      "dashboard-header",
      styles.x,
      styles["control-bar"]
    )}
  >
    <Input
      decorator={<SearchIcon />}
      disabled={disabled}
      onChange={(event): void => onQueryChange(event.target.value)}
      placeholder={"Search your muted users"}
      size={"lg"}
      slot_props={{
        container: {
          className: clsx("f-grow", styles.x, styles.input)
        }
      }}
      type={"search"}
      value={query}
    />
    <Divider orientation={"vertical"} />
    <Select
      disabled={disabled}
      onValueChange={onSortChange}
      slot_props={{
        trigger: {
          "aria-label": "Sort items",
          className: clsx("focus-invert", styles.x, styles["select-trigger"])
        },
        value: {
          placeholder: "Sort"
        }
      }}
      value={sort}
    >
      <Option value={"recent"}>Recent</Option>
      <Option value={"old"}>Old</Option>
    </Select>
  </div>
);

const ModerationMutesClient = (props: MutesProps): React.ReactElement => {
  const [sort, setSort] = React.useState<MutesSortValue>("recent");
  const [query, setQuery] = React.useState<string>("");
  const [page, set_page] = React.useState<number>(1);
  const debounced_query = use_debounce(query);
  const { data, isLoading, isFetching, isError, error, refetch } =
    use_get_muted_users_query({
      page,
      sort,
      query: debounced_query
    });
  const { items = [], has_more } = data || {};
  const is_typing = query !== debounced_query;

  const load_more = React.useCallback(
    () => set_page((prev_state) => prev_state + 1),
    []
  );

  const handleSortChange = React.useCallback((newSort: MutesSortValue) => {
    set_page(1);
    setSort(newSort);
  }, []);

  const handleQueryChange = React.useCallback((newQuery: string) => {
    set_page(1);
    setQuery(newQuery);
  }, []);

  return (
    <React.Fragment>
      <main>
        <DashboardTitle>Muted users</DashboardTitle>
        <StatusHeader {...props} />
        <ControlBar
          disabled={!items.length}
          onQueryChange={handleQueryChange}
          onSortChange={handleSortChange}
          query={query}
          sort={sort}
        />
        {isLoading || is_typing || (isFetching && page === 1) ? (
          <UserListSkeleton />
        ) : isError ? (
          <ErrorState
            auto_size
            component_props={{
              button: { loading: isFetching }
            }}
            retry={refetch}
            type={get_query_error_type(error)}
          />
        ) : !isFetching && !items.length ? (
          <EmptyState query={query} />
        ) : (
          <VirtualizedUserList
            has_more={Boolean(has_more)}
            load_more={load_more}
            userProps={{
              action_type: "mute"
            }}
            users={items}
          />
        )}
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <ModerationMutesRightSidebar />
    </React.Fragment>
  );
};

export default ModerationMutesClient;
