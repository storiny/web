import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Input from "~/components/Input";
import NavigationItem from "~/components/NavigationItem";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import PageTitle from "~/entities/PageTitle";
import SearchIcon from "~/icons/Search";

import {
  dashboardGroups,
  Group,
  searchDashboardGroups
} from "../../../../groups";
import styles from "./navigation-screen.module.scss";

// Group component

const GroupComponent = ({ group }: { group: Group }): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["navigation-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      {group.title}
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["item-container"])}>
      {group.items.map((item) => (
        <React.Fragment key={item.value}>
          <NavigationItem
            as={NextLink}
            decorator={item.decorator}
            href={`/me/${item.value}`}
          >
            {item.title}
          </NavigationItem>
          <Separator className={"hide-last"} invertMargin />
        </React.Fragment>
      ))}
    </div>
  </div>
);

const DashboardNavigationScreen = (): React.ReactElement => {
  const [query, setQuery] = React.useState<string>("");
  const [results, setResults] = React.useState<Group[]>([]);

  return (
    <React.Fragment>
      <PageTitle dashboard hideBackButton>
        Settings
      </PageTitle>
      {/* Page header */}
      <div
        className={clsx(
          "flex-center",
          "full-bleed",
          "page-header",
          "dashboard-header",
          "with-page-title"
        )}
      >
        <Input
          decorator={<SearchIcon />}
          onChange={(event): void => {
            const value = event.target.value;
            setQuery(value);
            searchDashboardGroups(value).then(setResults);
          }}
          placeholder={"Search settings"}
          size={"lg"}
          slot_props={{
            container: {
              className: clsx("f-grow", styles.x, styles.input)
            }
          }}
          type={"search"}
          value={query}
        />
      </div>
      <div className={clsx("flex-col", styles.x, styles["navigation-screen"])}>
        {query ? (
          results.length ? (
            results.map((group) => (
              <GroupComponent group={group} key={group.title} />
            ))
          ) : (
            <Typography
              className={clsx("t-center", "t-minor")}
              level={"body2"}
              style={{ margin: "24px" }}
            >
              Could not find anything for &quot;
              <span className={"t-medium"} style={{ wordBreak: "break-all" }}>
                {query}
              </span>
              &quot;
            </Typography>
          )
        ) : (
          dashboardGroups.map((group) => (
            <GroupComponent group={group} key={group.title} />
          ))
        )}
      </div>
      <Spacer className={"f-grow"} orientation={"vertical"} size={12} />
    </React.Fragment>
  );
};

export default DashboardNavigationScreen;
