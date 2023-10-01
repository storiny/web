import { clsx } from "clsx";
import React from "react";

import Button, { ButtonProps } from "~/components/button";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./insert-item.module.scss";

type InsertItemProps = {
  decorator: React.ReactNode;
  label: React.ReactNode;
} & ButtonProps;

const InsertItem = React.forwardRef<HTMLButtonElement, InsertItemProps>(
  (props, ref) => {
    const { decorator, label, className, ...rest } = props;
    return (
      <Button
        {...rest}
        as={"li"}
        className={clsx(css["focus-invert"], styles.x, styles.item, className)}
        ref={ref}
        variant={"ghost"}
      >
        <span className={clsx(css["flex-center"], styles.icon)}>
          {decorator}
        </span>
        <Typography
          as={"span"}
          className={clsx(styles.x, styles.label)}
          ellipsis
          level={"body2"}
        >
          {label}
        </Typography>
      </Button>
    );
  }
);

InsertItem.displayName = "InsertItem";

export default InsertItem;
