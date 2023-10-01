import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import TitleBlock from "~/entities/title-block";
import css from "~/theme/main.module.scss";

import DashboardGroup from "../../../../../dashboard-group";
import styles from "./account-removal.module.scss";
import DeleteAccount from "./delete-account";
import DisableAccount from "./disable-account";

const AccountRemovalGroup = (): React.ReactElement => (
  <DashboardGroup>
    <TitleBlock title={"Account removal"}>
      If you&apos;re feeling overwhelmed or simply need a break, you can
      temporarily disable your account. This option will hide your account and
      stories, and suspend all activities related to your account until you log
      back in.
      <br />
      <br />
      Alternatively, you can choose to permanently delete your account. Please
      note that after you request deletion, you have 30 days to log back in to
      recover your account. After this period, your account will be permanently
      deleted, and there is no way to recover it.
      <br />
      <br />
      If you wish to reclaim your username or email associated with the deleted
      account, it&apos;s recommended to change them before requesting deletion.
      This way, you can use them with another account.
    </TitleBlock>
    <Spacer orientation={"vertical"} size={4.5} />
    <div className={clsx(css["flex"], styles.actions)}>
      <DisableAccount />
      <DeleteAccount />
    </div>
  </DashboardGroup>
);

export default AccountRemovalGroup;
