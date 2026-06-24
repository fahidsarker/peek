import { redirectToLogin } from "@/lib/session";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectToLogin();

  return children;
}
