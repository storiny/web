import clsx from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { TitleBlockProps } from "./title-block.props";

const TitleBlock = (props: TitleBlockProps): React.ReactElement => {
  const { title, className, component_props, children, ...rest } = props;
  return (
    <div {...rest} className={clsx(css["flex-col"], className)}>
      <Typography as={"h2"} level={"h4"} {...component_props?.title}>
        {title}
      </Typography>
      <Spacer orientation={"vertical"} />
      <Typography color={"minor"} level={"body2"} {...component_props?.content}>
        {children}
      </Typography>
    </div>
  );
};

export default TitleBlock;
