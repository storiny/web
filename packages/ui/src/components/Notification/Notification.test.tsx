import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Notification from "./Notification";
import { NotificationProps } from "./Notification.props";
import NotificationProvider from "./Provider";

describe("<Notification />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = renderTestWithProvider(
      <NotificationProvider>
        <Notification data-testid={"notification"} open>
          Test
        </Notification>
      </NotificationProvider>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("notification")).toBeInTheDocument();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <NotificationProvider>
        <Notification open>Test</Notification>
      </NotificationProvider>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            list: { enabled: false },
            "aria-allowed-role": { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <NotificationProvider>
        <Notification as={"aside"} data-testid={"notification"} open>
          Test
        </Notification>
      </NotificationProvider>
    );

    expect(getByTestId("notification").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <NotificationProvider>
        <Notification
          icon={"info"}
          open
          slotProps={
            {
              decorator: { "data-testid": "decorator" }
            } as NotificationProps["slotProps"]
          }
        >
          Test
        </Notification>
      </NotificationProvider>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <NotificationProvider>
        <Notification
          icon={"info"}
          open
          slotProps={
            {
              decorator: { "data-testid": "decorator" },
              actions: { "data-testid": "actions" },
              primaryButton: { "data-testid": "primary-button" },
              secondaryButton: { "data-testid": "secondary-button" }
            } as NotificationProps["slotProps"]
          }
        >
          Test
        </Notification>
      </NotificationProvider>
    );

    ["decorator", "actions", "primary-button", "secondary-button"].forEach(
      (element) => {
        expect(getByTestId(element)).toBeInTheDocument();
      }
    );
  });
});
