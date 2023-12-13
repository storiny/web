import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Notification from "./notification";
import { NotificationProps } from "./notification.props";
import NotificationProvider from "./provider";

describe("<Notification />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = render_test_with_provider(
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
    const { baseElement } = render_test_with_provider(
      <NotificationProvider>
        <Notification open>Test</Notification>
      </NotificationProvider>
    );

    expect(
      await axe(baseElement, {
        rules: {
          list: { enabled: false },
          "aria-allowed-role": { enabled: false }
        }
      })
    ).toHaveNoViolations();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <NotificationProvider>
        <Notification as={"aside"} data-testid={"notification"} open>
          Test
        </Notification>
      </NotificationProvider>
    );

    expect(getByTestId("notification").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <NotificationProvider>
        <Notification
          icon={"info"}
          open
          slot_props={
            {
              decorator: { "data-testid": "decorator" }
            } as NotificationProps["slot_props"]
          }
        >
          Test
        </Notification>
      </NotificationProvider>
    );

    expect(getByTestId("decorator")).toBeInTheDocument();
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <NotificationProvider>
        <Notification
          icon={"info"}
          open
          slot_props={
            {
              decorator: { "data-testid": "decorator" },
              actions: { "data-testid": "actions" },
              primary_button: { "data-testid": "primary-button" },
              secondary_button: { "data-testid": "secondary-button" }
            } as NotificationProps["slot_props"]
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
