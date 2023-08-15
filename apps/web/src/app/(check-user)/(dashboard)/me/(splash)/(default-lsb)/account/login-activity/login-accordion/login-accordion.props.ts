import { LoginActivityProps } from "../login-activity.props";

export interface LoginAccordionProps {
  login: LoginActivityProps["logins"][number];
  onLogout: () => void;
}
