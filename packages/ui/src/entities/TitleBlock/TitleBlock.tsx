import clsx from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";

import { TitleBlockProps } from "./TitleBlock.props";

const TitleBlock = (props: TitleBlockProps): React.ReactElement => {
  const { title, className, componentProps, children, ...rest } = props;
  return (
    <div {...rest} className={clsx("flex-col", className)}>
      <Typography as={"h2"} level={"h4"} {...componentProps?.title}>
        {title}
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography
        className={"t-minor"}
        level={"body2"}
        {...componentProps?.content}
      >
        {children}
      </Typography>
    </div>
  );
};

export default TitleBlock;
