import { use_app_router } from "@storiny/web/src/common/utils";
import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import IconButton from "~/components/icon-button";
import ChevronIcon from "~/icons/chevron";
import css from "~/theme/main.module.scss";

import styles from "./page-title.module.scss";
import { PageTitleProps } from "./page-title.props";

const PageTitle = (props: PageTitleProps): React.ReactElement => {
  const {
    dashboard,
    back_button_href,
    hide_back_button_on_desktop,
    className,
    component_props,
    children,
    ...rest
  } = props;
  const router = use_app_router();
  return (
    <header
      {...rest}
      className={clsx(
        css["full-bleed"],
        css["page-header"],
        css["flex"],
        css["t-bold"],
        styles["page-title"],
        dashboard && css["dashboard-header"],
        className
      )}
    >
      <IconButton
        aria-label={"Navigate to the previous page"}
        {...(back_button_href
          ? { as: NextLink, href: back_button_href }
          : // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            { onClick: (): void => router.back() })}
        {...component_props?.back_button}
        className={clsx(
          hide_back_button_on_desktop && css["below-desktop"],
          component_props?.back_button?.className
        )}
        size={"sm"}
        title={"Back"}
        variant={"ghost"}
      >
        <ChevronIcon rotation={-90} />
      </IconButton>
      {children}
    </header>
  );
};

export default PageTitle;
