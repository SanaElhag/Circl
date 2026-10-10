import { redirect } from "next/navigation";
export default function MyGearPage() {
  redirect("/dashboard?mode=owner&tab=listings");
}