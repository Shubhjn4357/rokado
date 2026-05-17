import { redirect } from "next/navigation";

// Landing page redirects to /dashboard inside the ERP shell
export default function Home() {
  redirect("/dashboard");
}
