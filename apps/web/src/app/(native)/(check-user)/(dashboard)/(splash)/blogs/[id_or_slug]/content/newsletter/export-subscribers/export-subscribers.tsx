import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import TitleBlock from "~/entities/title-block";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../../common/dashboard-group";

const ExportSubscribers = (): React.ReactElement => (
  <DashboardGroup>
    <TitleBlock title={"Export subscribers"}>
      Export the list of all subscribers who have subscribed to this blog. You
      can only export it by agreeing to follow our{" "}
      <Link href={"/terms"} target={"_blank"}>
        terms
      </Link>
      , which include important requirements for how you use subscriber
      information.
    </TitleBlock>
    <Spacer orientation={"vertical"} size={4} />
    <Button
      auto_size
      check_auth
      className={css["fit-w"]}
      disabled
      variant={"hollow"}
    >
      Available soon
    </Button>
  </DashboardGroup>
);

export default ExportSubscribers;
