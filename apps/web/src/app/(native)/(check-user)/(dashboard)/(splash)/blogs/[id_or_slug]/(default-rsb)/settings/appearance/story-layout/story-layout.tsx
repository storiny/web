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
import { use_blog_story_layout_settings_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "../common.module.scss";

const DefaultLayoutPreview = (): React.ReactElement => (
  <svg fill="none" viewBox="0 0 200 124">
    <path d="M0 .81h200v122.81H0z" fill="var(--bg-body)" />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="70.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="130.09"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="26.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="51.83"
      x="65.08"
      y="74.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="41.83"
      x="65.08"
      y="78.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="27.83"
      x="65.08"
      y="82.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="57.83"
      x="65.08"
      y="86.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="102.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="41.83"
      x="65.08"
      y="106.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="13.83"
      x="65.08"
      y="29.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="24.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="70.83"
      x="65.08"
      y="39.08"
    />
    <mask fill="#fff" id="a">
      <path d="M142.6 16.6H200v106.85h-57.4V16.6Z" />
    </mask>
    <path
      d="M142.6 16.6H200v106.85h-57.4V16.6Z"
      fill="var(--bg-elevation-sm)"
    />
    <path
      d="M142.76 123.45V16.6h-.34v106.85h.34Z"
      fill="var(--divider)"
      mask="url(#a)"
    />
    <mask fill="#fff" id="b">
      <path d="M0 16.6h57.4v106.85H0V16.6Z" />
    </mask>
    <path d="M0 16.6h57.4v106.85H0V16.6Z" fill="var(--bg-elevation-sm)" />
    <path
      d="M57.24 16.6v106.85h.34V16.6h-.34Z"
      fill="var(--divider)"
      mask="url(#b)"
    />
    <mask fill="#fff" id="c">
      <path d="M0 .8h200v15.8H0V.8Z" />
    </mask>
    <path d="M0 .8h200v15.8H0V.8Z" fill="var(--bg-elevation-md)" />
    <path d="M200 16.43H0v.34h200v-.34Z" fill="var(--divider)" mask="url(#c)" />
    <rect
      fill="var(--divider)"
      height="5.93"
      rx="2.96"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.93"
      x="188.4"
      y="5.28"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="23.96"
      y="6.15"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="5.67"
      y="6.15"
    />
  </svg>
);

const MinimalLayoutPreview = (): React.ReactElement => (
  <svg fill="none" viewBox="0 0 200 124">
    <path d="M0 .81h200v122.81H0z" fill="var(--bg-body)" />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="65.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="3.83"
      x="70.08"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.83"
      x="130.09"
      y="22.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="26.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="51.83"
      x="65.08"
      y="74.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="41.83"
      x="65.08"
      y="78.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="27.83"
      x="65.08"
      y="82.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="57.83"
      x="65.08"
      y="86.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="31.83"
      x="65.08"
      y="102.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="41.83"
      x="65.08"
      y="106.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="1.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="13.83"
      x="65.08"
      y="29.08"
    />
    <rect
      fill="var(--bg-elevation-md)"
      height="24.83"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="70.83"
      x="65.08"
      y="39.08"
    />
    <mask fill="#fff" id="a">
      <path d="M0 .8h200v15.8H0V.8Z" />
    </mask>
    <path d="M0 .8h200v15.8H0V.8Z" fill="var(--bg-elevation-md)" />
    <path d="M200 16.43H0v.34h200v-.34Z" fill="var(--divider)" mask="url(#a)" />
    <rect
      fill="var(--divider)"
      height="5.93"
      rx="2.96"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="5.93"
      x="188.4"
      y="5.28"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="23.96"
      y="6.15"
    />
    <rect
      fill="var(--divider)"
      height="4.23"
      rx=".59"
      stroke="var(--divider)"
      strokeWidth=".17"
      width="16.09"
      x="5.67"
      y="6.15"
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

const StoryLayoutSettings = (): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const ratio = is_smaller_than_mobile ? 2.21 : 1.62;
  const blog = use_blog_context();
  const [mutate_story_layout, { isLoading: is_loading }] =
    use_blog_story_layout_settings_mutation();

  /**
   * Dispatches the current story layout settings
   */
  const dispatch_story_layout_settings = React.useCallback(
    (layout: "default" | "minimal") => {
      mutate_story_layout({
        layout,
        blog_id: blog.id
      })
        .unwrap()
        .then(() => {
          blog.mutate({ is_story_minimal_layout: layout === "minimal" });
        })
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            null,
            "Could not update the story layout"
          )
        );
    },
    [mutate_story_layout, blog, toast]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Story layout"}>
        Choose how your stories appear to your readers. Choosing the minimal
        layout will hide the table of contents for the stories.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4} />
      <RadioGroup
        className={clsx(styles.x, styles["radio-group"])}
        disabled={is_loading}
        onValueChange={(next_value): void => {
          dispatch_story_layout_settings(next_value as "default" | "minimal");
        }}
        orientation={is_smaller_than_mobile ? "vertical" : "horizontal"}
        value={blog.is_story_minimal_layout ? "minimal" : "default"}
      >
        <LayoutItem
          disabled={is_loading}
          is_active={!blog.is_story_minimal_layout}
          label={"Default"}
          preview={<DefaultLayoutPreview />}
          ratio={ratio}
          value={"default"}
        />
        <LayoutItem
          disabled={is_loading}
          is_active={blog.is_story_minimal_layout}
          label={"Minimal"}
          preview={<MinimalLayoutPreview />}
          ratio={ratio}
          value={"minimal"}
        />
      </RadioGroup>
    </DashboardGroup>
  );
};

export default StoryLayoutSettings;
