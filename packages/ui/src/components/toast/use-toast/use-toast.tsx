import { render_toast } from "~/redux/features/toast/slice";
import { use_app_dispatch } from "~/redux/hooks";

import { ToastSeverity } from "../toast.props";

/**
 * Hooks for rendering toasts
 */
export const use_toast = (): ((
  message: string,
  severity?: ToastSeverity
) => void) => {
  const dispatch = use_app_dispatch();
  return (message: string, severity?: ToastSeverity): void => {
    dispatch(render_toast({ message, severity }));
  };
};
