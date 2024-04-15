import { clsx } from "clsx";
import React from "react";

import BlogNavbar from "~/layout/blog-navbar";
import css from "~/theme/main.module.scss";

const Page = (): React.ReactElement => (
  <React.Fragment>
    <div className={clsx(css["grid"], css["grid-container"], css.minimal)}>
      <BlogNavbar />
      <main data-root={"true"}>Newsletter</main>
    </div>
  </React.Fragment>
);

export { metadata } from "./metadata";
export default Page;
