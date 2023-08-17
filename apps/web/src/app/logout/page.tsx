import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_ID } from "~/common/utils/getSessionToken";

const LogoutPage = ({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): void => {
  cookies().delete(SESSION_COOKIE_ID);
  redirect(
    searchParams.to ? decodeURIComponent(String(searchParams.to)) : "/login"
  );
};

export default LogoutPage;
