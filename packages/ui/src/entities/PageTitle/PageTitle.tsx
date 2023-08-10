import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import IconButton from "~/components/IconButton";
import ChevronIcon from "~/icons/Chevron";

import styles from "./PageTitle.module.scss";
import { PageTitleProps } from "./PageTitle.props";

const PageTitle = (props: PageTitleProps): React.ReactElement => {
  const {
    dashboard,
    backButtonHref,
    hideBackButton,
    className,
    componentProps,
    children,
    ...rest
  } = props;
  const router = useRouter();

  return (
    <header
      {...rest}
      className={clsx(
        "page-header",
        "flex",
        "t-bold",
        styles["page-title"],
        dashboard && "dashboard-header",
        className
      )}
    >
      {!hideBackButton && (
        <IconButton
          aria-label={"Navigate to the previous page"}
          {...(backButtonHref
            ? { as: NextLink, href: backButtonHref }
            : { onClick: (): void => router.back() })}
          {...componentProps?.backButton}
          size={"sm"}
          title={"Back"}
          variant={"ghost"}
        >
          <ChevronIcon rotation={-90} />
        </IconButton>
      )}
      {children}
    </header>
  );
};

export default PageTitle;
