import "server-only";

import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { notFound as not_found } from "next/dist/client/components/not-found";
import React from "react";

import PlusPattern from "~/brand/plus-pattern";
import { get_blog_newsletter } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";
import Link from "~/components/link";
import Main from "~/components/main";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Persona from "~/entities/persona";
import Navbar from "~/layout/navbar";
import SplashScreen from "~/layout/splash-screen";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import auth_styles from "../../../(native)/(auth)/layout.module.scss";
import { BlogNewsletterInfoContext } from "./context";
import styles from "./styles.module.scss";

const BlogNewsletterLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: { slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_valid_blog_slug(params.slug)) {
      not_found();
    }

    const user_id = await get_user();
    const response = await get_blog_newsletter({
      identifier: params.slug,
      current_user_id: user_id || undefined
    });
    const { name, description, user, newsletter_splash_id } = response;

    return (
      <BlogNewsletterInfoContext.Provider value={response}>
        <div className={clsx(css["grid"], css["grid-container"], css.minimal)}>
          <Navbar variant={"minimal"} />
          <div
            className={clsx(
              css["full-w"],
              css["full-h"],
              styles.splash,
              newsletter_splash_id && styles["has-splash"]
            )}
            role={"presentation"}
            style={
              {
                "--splash-url": newsletter_splash_id
                  ? `url("${get_cdn_url(
                      newsletter_splash_id,
                      ImageSize.W_2440
                    )}")`
                  : undefined
              } as React.CSSProperties
            }
          >
            {!newsletter_splash_id && <PlusPattern />}
          </div>
          {/* Need to make the <main /> styles more specific */}
          <Main className={clsx(auth_styles.x, auth_styles.main)}>
            <div className={clsx(css["flex-col"], auth_styles.container)}>
              <div className={clsx(css["flex-col"], styles.content)}>
                <Typography as={"h1"} scale={"xl"}>
                  {name}
                </Typography>
                <Spacer orientation={"vertical"} size={2} />
                <Persona
                  avatar={{
                    alt: `${user?.name}'s avatar`,
                    hex: user?.avatar_hex,
                    avatar_id: user?.avatar_id,
                    label: user?.name
                  }}
                  primary_text={
                    <span>
                      <Typography as={"span"} color={"minor"}>
                        By
                      </Typography>{" "}
                      <Link
                        fixed_color
                        href={`${process.env.NEXT_PUBLIC_WEB_URL}/${user?.username}`}
                        target={"_blank"}
                        title={`View ${user?.name}'s profile`}
                      >
                        {user?.name}
                      </Link>
                    </span>
                  }
                />
                {Boolean((description || "").trim().length) && (
                  <React.Fragment>
                    <Spacer orientation={"vertical"} size={3} />
                    <Typography color={"minor"} level={"body2"}>
                      {description}
                    </Typography>
                  </React.Fragment>
                )}
                <Spacer
                  className={css["f-grow"]}
                  orientation={"vertical"}
                  size={10}
                />
                {children}
                <Spacer orientation={"vertical"} size={1} />
              </div>
            </div>
          </Main>
          <SplashScreen />
        </div>
      </BlogNewsletterInfoContext.Provider>
    );
  } catch (e) {
    handle_exception(e);
  }
};

export default BlogNewsletterLayout;
