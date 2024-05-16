import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import AspectRatio from "~/components/aspect-ratio";
import Divider from "~/components/divider";
import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";
import { use_media_query } from "~/hooks/use-media-query";
import { use_blog_page_layout_settings_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "../common.module.scss";

const DefaultLayoutPreview = (): React.ReactElement => (
  <svg fill="none" viewBox="0 0 200 123">
    <path d="M0 0h200v122.81H0z" fill="var(--bg-body)" />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="64.12"
      y="21.61"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="9.83"
      x="67.12"
      y="24.61"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".92"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="1.83"
      x="64.12"
      y="24.61"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="64.12"
      y="37.79"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="69.12"
      y="37.79"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="129.12"
      y="37.79"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="13.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="109.08"
      y="21.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="64.12"
      y="48.14"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="9.83"
      x="67.12"
      y="51.14"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".92"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="1.83"
      x="64.12"
      y="51.14"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="64.12"
      y="64.31"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="69.12"
      y="64.31"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="129.12"
      y="64.31"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="13.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="109.08"
      y="47.79"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="64.12"
      y="74.66"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="9.83"
      x="67.12"
      y="77.66"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".92"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="1.83"
      x="64.12"
      y="77.66"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="64.12"
      y="90.84"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="69.12"
      y="90.84"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="129.12"
      y="90.84"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="13.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="25.83"
      x="109.08"
      y="74.31"
    />
    <mask fill="#fff" id="page-default-layout-a">
      <path d="M142.6 15.79H200v106.86h-57.4V15.79Z" />
    </mask>
    <path
      d="M142.6 15.79H200v106.86h-57.4V15.79Z"
      fill="var(--bg-elevation-sm)"
    />
    <path
      d="M142.76 122.65V15.79h-.34v106.86h.34Z"
      fill="var(--divider)"
      mask="url(#page-default-layout-a)"
    />
    <mask fill="#fff" id="page-default-layout-b">
      <path d="M0 15.79h57.4v106.86H0V15.79Z" />
    </mask>
    <path d="M0 15.79h57.4v106.86H0V15.79Z" fill="var(--bg-elevation-sm)" />
    <path
      d="M57.24 15.79v106.86h.34V15.79h-.34Z"
      fill="var(--divider)"
      mask="url(#page-default-layout-b)"
    />
    <mask fill="#fff" id="page-default-layout-c">
      <path d="M0 0h200v15.79H0V0Z" />
    </mask>
    <path d="M0 0h200v15.79H0V0Z" fill="var(--bg-elevation-md)" />
    <path
      d="M200 15.62H0v.34h200v-.34Z"
      fill="var(--divider)"
      mask="url(#page-default-layout-c)"
    />
    <rect
      fill="var(--divider)"
      height="5.93"
      rx="2.96"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.93"
      x="188.4"
      y="4.47"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="23.96"
      y="5.35"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="5.67"
      y="5.35"
    />
  </svg>
);

const LargeLayoutPreview = (): React.ReactElement => (
  <svg fill="none" viewBox="0 0 200 123">
    <path d="M0 0h200v122.81H0z" fill="var(--bg-body)" />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="47.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="47.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="70.08"
      y="47.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="130.09"
      y="47.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="51.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="13.83"
      x="65.08"
      y="54.26"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="23.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="70.83"
      x="65.08"
      y="21.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="90.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="90.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="70.08"
      y="90.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="130.09"
      y="90.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="94.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="13.83"
      x="65.08"
      y="97.44"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="23.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="70.83"
      x="65.08"
      y="64.26"
    />
    <mask fill="#fff" id="page-large-layout-a">
      <path d="M142.6 15.79H200v106.86h-57.4V15.79Z" />
    </mask>
    <path
      d="M142.6 15.79H200v106.86h-57.4V15.79Z"
      fill="var(--bg-elevation-sm)"
    />
    <path
      d="M142.76 122.65V15.79h-.34v106.86h.34Z"
      fill="var(--divider)"
      mask="url(#page-large-layout-a)"
    />
    <mask fill="#fff" id="page-large-layout-b">
      <path d="M0 15.79h57.4v106.86H0V15.79Z" />
    </mask>
    <path d="M0 15.79h57.4v106.86H0V15.79Z" fill="var(--bg-elevation-sm)" />
    <path
      d="M57.24 15.79v106.86h.34V15.79h-.34Z"
      fill="var(--divider)"
      mask="url(#page-large-layout-b)"
    />
    <mask fill="#fff" id="page-large-layout-c">
      <path d="M0 0h200v15.79H0V0Z" />
    </mask>
    <path d="M0 0h200v15.79H0V0Z" fill="var(--bg-elevation-md)" />
    <path
      d="M200 15.62H0v.34h200v-.34Z"
      fill="var(--divider)"
      mask="url(#page-large-layout-c)"
    />
    <rect
      fill="var(--divider)"
      height="5.93"
      rx="2.96"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.93"
      x="188.4"
      y="4.47"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="23.96"
      y="5.35"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="5.67"
      y="5.35"
    />
  </svg>
);

const LayoutItem = ({
  preview,
  is_active,
  ratio,
  label,
  value,
  disabled
}: {
  disabled?: boolean;
  is_active: boolean;
  label: React.ReactNode;
  preview: React.ReactNode;
  ratio: number;
  value: string;
}): React.ReactElement => (
  <div
    className={clsx(
      css["flex-col"],
      styles.item,
      disabled && styles.disabled,
      is_active && styles.selected
    )}
  >
    <AspectRatio className={css["full-w"]} ratio={ratio}>
      {preview}
    </AspectRatio>
    <Divider />
    <Radio
      className={clsx(styles.x, styles.radio)}
      label={label}
      slot_props={{
        container: {
          className: clsx(styles.x, styles["radio-container"])
        }
      }}
      value={value}
    />
  </div>
);

const PageLayoutSettings = (): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const ratio = is_smaller_than_mobile ? 2.21 : 1.62;
  const blog = use_blog_context();
  const [mutate_page_layout, { isLoading: is_loading }] =
    use_blog_page_layout_settings_mutation();

  /**
   * Dispatches the current page layout settings
   */
  const dispatch_page_layout_settings = React.useCallback(
    (layout: "default" | "large") => {
      mutate_page_layout({
        layout,
        blog_id: blog.id
      })
        .unwrap()
        .then(() => {
          blog.mutate({ is_homepage_large_layout: layout === "large" });
        })
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            null,
            "Could not update the page layout"
          )
        );
    },
    [mutate_page_layout, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Page layout"}>
        Choose how stories are displayed on your homepage.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4} />
      <RadioGroup
        className={clsx(styles.x, styles["radio-group"])}
        disabled={is_loading}
        onValueChange={(next_value): void => {
          dispatch_page_layout_settings(next_value as "default" | "large");
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
        value={blog.is_homepage_large_layout ? "large" : "default"}
      >
        <LayoutItem
          disabled={is_loading}
          is_active={!blog.is_homepage_large_layout}
          label={"Default"}
          preview={<DefaultLayoutPreview />}
          ratio={ratio}
          value={"default"}
        />
        <LayoutItem
          disabled={is_loading}
          is_active={blog.is_homepage_large_layout}
          label={"Large"}
          preview={<LargeLayoutPreview />}
          ratio={ratio}
          value={"large"}
        />
      </RadioGroup>
    </DashboardGroup>
  );
};

export default PageLayoutSettings;
