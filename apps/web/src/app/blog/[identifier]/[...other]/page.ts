import { redirect } from "next/navigation";

const Page = ({ params }: { params: { other: string[] } }): void => {
  const path = params.other.join("/");
  return redirect(`${process.env.NEXT_PUBLIC_WEB_URL}/${path}`);
};

export default Page;
