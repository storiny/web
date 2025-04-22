import { redirect } from "next/navigation";

const Page = async ({
  params
}: {
  params: Promise<{ other: string[] }>;
}): Promise<void> => {
  const path = (await params).other.join("/");
  return redirect(`${process.env.NEXT_PUBLIC_WEB_URL}/${path}`);
};

export default Page;
