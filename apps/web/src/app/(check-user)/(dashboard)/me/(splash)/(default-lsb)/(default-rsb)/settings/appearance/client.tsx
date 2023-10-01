"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
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
  const is_visible = use_app_selector(select_alert_visibility("appearance"));

  const handle_dismiss = React.useCallback(() => {
    dispatch(set_alert_visibility(["appearance", false]));
  }, [dispatch]);

  if (!is_visible) {
    return null;
  }

  return (
    <SettingsAlert on_dismiss={handle_dismiss}>
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
