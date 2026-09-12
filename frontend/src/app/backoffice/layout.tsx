import { AuthProvider } from "@/lib/auth-context";

export default function BackofficeLayout({
  children,
}: LayoutProps<"/backoffice">) {
  return (
    <AuthProvider>{children}</AuthProvider>
  );
}
