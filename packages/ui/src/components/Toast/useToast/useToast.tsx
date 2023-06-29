import { renderToast } from "~/redux/features/toast/slice";
import { useAppDispatch } from "~/redux/hooks";

import { ToastSeverity } from "../Toast.props";

export const useToast = (): ((
  message: string,
  severity?: ToastSeverity
) => void) => {
  const dispatch = useAppDispatch();
  return (message: string, severity?: ToastSeverity): void => {
    dispatch(renderToast({ message, severity }));
  };
};
