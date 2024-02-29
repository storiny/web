"use client";

import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import {
  select_alert_visibility,
  set_alert_visibility
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import DashboardTitle from "../../../../common/dashboard-title";
import DashboardWrapper from "../../../../common/dashboard-wrapper";
import SettingsAlert from "../alert";
import MiscellaneousPreferences from "./miscellaneous";
import MotionPreference from "./motion";

// Alert

const Alert = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const is_visible = use_app_selector(select_alert_visibility("accessibility"));

  const handle_dismiss = React.useCallback(() => {
    dispatch(set_alert_visibility(["accessibility", false]));
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

const AccessibilitySettingsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Accessibility</DashboardTitle>
    <DashboardWrapper>
      <Alert />
      <MotionPreference />
      <Divider />
      <MiscellaneousPreferences />
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default AccessibilitySettingsClient;
