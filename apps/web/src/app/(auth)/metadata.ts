import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continue to Storiny",
  description:
    "Log in or sign up for Storiny to stay updated with the latest stories from writers worldwide.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL}/auth`
  }
};
