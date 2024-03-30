import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import Input from "~/components/input";
import NavigationItem from "~/components/navigation-item";
import NoSsr from "~/components/no-ssr";
import Separator from "~/components/separator";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import PageTitle from "~/entities/page-title";
import { use_handle_dynamic_state } from "~/hooks/use-handle-dynamic-state";
import SearchIcon from "~/icons/search";
import css from "~/theme/main.module.scss";

import { Group } from "../../../common/left-sidebar";
import { DASHBOARD_GROUPS, search_dashboard_groups } from "../../groups";
import { DashboardSegment } from "../../types";
import styles from "./navigation-screen.module.scss";

// Group component

const GroupComponent = ({
  group
}: {
  group: Group<DashboardSegment>;
}): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles["navigation-group"])}>
    <Typography color={"minor"} level={"body2"} weight={"medium"}>
      {group.title}
    </Typography>
    <div className={clsx(css["flex-col"], styles["item-container"])}>
      {group.items.map((item) => (
        <React.Fragment key={item.value}>
          <NavigationItem
            as={NextLink}
            decorator={item.decorator}
            href={`/me/${item.value}`}
          >
            {item.title}
          </NavigationItem>
          <Separator className={css["hide-last"]} invert_margin />
        </React.Fragment>
      ))}
    </div>
  </div>
);

const DashboardNavigationScreen = (): React.ReactElement => {
  const [query, set_query] = React.useState<string>("");
  const [results, set_results] = React.useState<Group<DashboardSegment>[]>([]);
  use_handle_dynamic_state<typeof query>("", set_query);
  use_handle_dynamic_state<typeof results>([], set_results);

  return (
    <NoSsr fallback={<SuspenseLoader style={{ minHeight: "250px" }} />}>
      <PageTitle dashboard hide_back_button>
        Settings
      </PageTitle>
      {/* Page header */}
      <div
        className={clsx(
          css["flex-center"],
          css["full-bleed"],
          css["page-header"],
          css["dashboard-header"],
          css["with-page-title"]
        )}
      >
        <Input
          decorator={<SearchIcon />}
          onChange={(event): void => {
            const value = event.target.value;
            set_query(value);
            search_dashboard_groups(value).then(set_results);
          }}
          placeholder={"Search settings"}
          size={"lg"}
          type={"search"}
          value={query}
        />
      </div>
      <div className={clsx(css["flex-col"], styles["navigation-screen"])}>
        {query ? (
          results.length ? (
            results.map((group) => (
              <GroupComponent group={group} key={group.title} />
            ))
          ) : (
            <Typography
              className={css["t-center"]}
              color={"minor"}
              level={"body2"}
              style={{ margin: "24px" }}
            >
              Could not find anything for &quot;
              <span
                className={css["t-medium"]}
                style={{ wordBreak: "break-all" }}
              >
                {query}
              </span>
              &quot;
            </Typography>
          )
        ) : (
          DASHBOARD_GROUPS.map((group) => (
            <GroupComponent group={group} key={group.title} />
          ))
        )}
      </div>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={12} />
    </NoSsr>
  );
};

export default DashboardNavigationScreen;
