"use client";

import React from "react";

import Divider from "../../../../../../../../../../../../packages/ui/src/components/divider";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import {
  select_alert_visibility,
  set_alert_visibility
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import SettingsAlert from "../alert";
import CodeFontPreference from "./code-font-preference";
import ReadingFontPreference from "./reading-font-preference";
import ThemePreference from "./theme-preference";

// Alert

const Alert = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const isVisible = use_app_selector(select_alert_visibility("appearance"));

  const handleDismiss = React.useCallback(() => {
    dispatch(set_alert_visibility(["appearance", false]));
  }, [dispatch]);

  if (!isVisible) {
    return null;
  }

  return (
    <SettingsAlert onDismiss={handleDismiss}>
      The settings on this page only affect the accounts in this browser.
    </SettingsAlert>
  );
};

const AppearanceSettingsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Appearance</DashboardTitle>
    <DashboardWrapper>
      <Alert />
      <ThemePreference />
      <Divider />
      <ReadingFontPreference />
      <Divider />
      <CodeFontPreference />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default AppearanceSettingsClient;
