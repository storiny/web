import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import { SESSION_COOKIE_ID } from "~/common/constants";

export const GET = async (request: NextRequest): Promise<void> => {
  const search_params = request.nextUrl.searchParams;

  cookies().delete(SESSION_COOKIE_ID);
  redirect(
    search_params.has("to")
      ? decodeURIComponent(search_params.get("to") || "")
      : "/login"
  );
};
