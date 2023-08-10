import { renderNotification } from "~/redux/features/notification/slice";
import { useAppDispatch } from "~/redux/hooks";

import { NotificationIcon } from "../Notification.props";

/**
 * Hook for rendering notifications
 */
export const useNotification = (): ((
  message: string,
  {
    icon,
    primaryText,
    secondaryText
  }?: { icon?: NotificationIcon; primaryText?: string; secondaryText?: string }
) => void) => {
  const dispatch = useAppDispatch();

  return (
    message: string,
    {
      icon,
      primaryText,
      secondaryText
    }: {
      icon?: NotificationIcon;
      primaryText?: string;
      secondaryText?: string;
    } = {}
  ) => {
    dispatch(renderNotification({ message, icon, primaryText, secondaryText }));
  };
};
