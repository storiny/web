"use client";

import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";
import { selectAlertVisibility, setAlertVisibility } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import SettingsAlert from "../alert";
import MiscellaneousPreferences from "./miscellaneous";
import MotionPreference from "./motion";

// Alert

const Alert = (): React.ReactElement | null => {
  const dispatch = useAppDispatch();
  const isVisible = useAppSelector(selectAlertVisibility("accessibility"));

  const handleDismiss = React.useCallback(() => {
    dispatch(setAlertVisibility(["accessibility", false]));
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

const AccessibilitySettings = (): React.ReactElement => (
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

export default AccessibilitySettings;
