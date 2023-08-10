import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_ID } from "~/common/utils/getUser";

const LogoutPage = (): void => {
  cookies().delete(SESSION_COOKIE_ID);
  redirect("/login");
};

export default LogoutPage;
