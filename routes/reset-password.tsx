import { FreshContext, PageProps } from "$fresh/server.ts";
import ResetPasswordForm from "../islands/ResetPasswordForm.tsx";

export default function ResetPasswordPage(props: PageProps) {
  const token = props.url.searchParams.get("token") || undefined;

  return (
    <div className="flex items-center justify-center min-h-screen bg-accent p-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
