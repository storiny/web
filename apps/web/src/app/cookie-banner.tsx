"use client";

import { usePostHog as use_posthog } from "posthog-js/react";
import React from "react";

import Notification from "~/components/notification";
import CookieIcon from "~/icons/cookie";

const LOCAL_STORAGE_KEY = "cookie_consent";

type CookieConsentValue = "accepted" | "declined" | "pending";

/**
 * Checks whether the provided cookie consent `value` is a valid.
 * @param value The cookie consent value to check.
 */
const is_valid_cookie_consent_value = (
  value: string | null
): value is CookieConsentValue =>
  !!value && ["accepted", "declined", "pending"].includes(value);

/**
 * Loads the cookie consent value from the local storage.
 */
export const get_cookie_consent_value = (): CookieConsentValue => {
  const value = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!is_valid_cookie_consent_value(value)) {
    return "pending";
  }

  return value;
};

const CookieConsent = (): React.ReactElement | null => {
  const [consent_value, set_consent_value] =
    React.useState<CookieConsentValue | null>(null);
  const posthog = use_posthog();

  React.useEffect(() => {
    set_consent_value(get_cookie_consent_value());
  }, []);

  React.useEffect(() => {
    if (!!consent_value && consent_value !== "pending") {
      posthog.set_config({
        persistence:
          consent_value === "accepted" ? "localStorage+cookie" : "memory"
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent_value]);

  const handle_accept = (): void => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "accepted" as CookieConsentValue);
    set_consent_value("accepted");
  };

  const handle_decline = (): void => {
    localStorage.setItem(LOCAL_STORAGE_KEY, "declined" as CookieConsentValue);
    set_consent_value("declined");
  };

  return (
    <Notification
      icon={<CookieIcon />}
      open={consent_value === "pending"}
      primary_button_text={"Accept"}
      secondary_button_text={"Decline"}
      slot_props={{
        primary_button: {
          onClick: handle_accept,
          type: "button"
        },
        secondary_button: {
          onClick: handle_decline,
          type: "button"
        }
      }}
      style={
        {
          "--notification-max-width": "380px"
        } as React.CSSProperties
      }
    >
      We use mandatory session cookies for login and optional tracking cookies
      to improve your experience. By accepting, you help us enhance the site.
      You can adjust your preferences in your browser settings.
    </Notification>
  );
};

export default CookieConsent;
