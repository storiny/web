import { LoginActivityProps } from "../login-activity.props";

export interface LoginAccordionProps {
  login: LoginActivityProps["logins"][number];
  on_logout: () => void;
}
