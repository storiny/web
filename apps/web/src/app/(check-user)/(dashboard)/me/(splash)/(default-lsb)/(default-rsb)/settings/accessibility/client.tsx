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
import MiscellaneousPreferences from "./miscellaneous";
import MotionPreference from "./motion";

// Alert

const Alert = (): React.ReactElement | null => {
  const dispatch = use_app_dispatch();
  const isVisible = use_app_selector(select_alert_visibility("accessibility"));

  const handleDismiss = React.useCallback(() => {
    dispatch(set_alert_visibility(["accessibility", false]));
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
