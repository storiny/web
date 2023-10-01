import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_ID } from "~/common/utils/get-session-token";

const LogoutPage = ({
  searchParams: search_params
}: {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  searchParams: { [key: string]: string | string[] | undefined };
}): void => {
  cookies().delete(SESSION_COOKIE_ID);
  redirect(
    search_params.to ? decodeURIComponent(String(search_params.to)) : "/login"
  );
};

export default LogoutPage;
