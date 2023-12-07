// Import { useRouter } from "next/navigation";
// Import React from "react";
//
// Import { useNotification } from "~/components/Notification";
// Import TypographyIcon from "~/icons/Typography";
// Import { set_font_settings_notification_visibility } from "~/redux/features";
// Import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

// TODO: Implement once `use_notification` gets fixed
//
// Const EditorFontSettingsNotification = (): null => {
//   Const router = use_router();
//   Const notify = useNotification();
//   Const dispatch = use_app_dispatch();
//   Const showNotification = use_app_selector(
//     (state) => state.preferences.show_font_settings_notification
//   );
//
//   React.useEffect(() => {
//     If (showNotification) {
//       Notify({
//         Open: true,
//         Children:
//           "Difficulty reading? Try adjusting font properties in your settings.",
//         PrimaryButtonText: "Settings",
//         SlotProps: {
//           PrimaryButton: {
//             OnClick: (): void => router.push("/me/settings/appearance")
//           },
//           SecondaryButton: {
//             OnClick: (): void => {
//               Dispatch(set_font_settings_notification_visibility(false));
//             }
//           }
//         },
//         Icon: <TypographyIcon />
//       });
//     }
//   }, [dispatch, notify, router, showNotification]);
//
//   Return null;
// };
//
// Export default EditorFontSettingsNotification;
