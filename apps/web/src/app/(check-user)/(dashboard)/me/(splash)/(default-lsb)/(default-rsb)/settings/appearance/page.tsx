"use client";

import React from "react";

import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";
import { selectAlertVisibility, setAlertVisibility } from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import SettingsAlert from "../alert";
import CodeFontPreference from "./code-font-preference";
import ReadingFontPreference from "./reading-font-preference";
import ThemePreference from "./theme-preference";

// Alert

const Alert = (): React.ReactElement | null => {
  const dispatch = useAppDispatch();
  const isVisible = useAppSelector(selectAlertVisibility("appearance"));

  const handleDismiss = React.useCallback(() => {
    dispatch(setAlertVisibility(["appearance", false]));
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

const AppearanceSettings = (): React.ReactElement => (
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

export default AppearanceSettings;
