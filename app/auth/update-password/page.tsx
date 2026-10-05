import { updatePassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { humanizeLoginError } from "@/lib/login-errors";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = humanizeLoginError(params.error);

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-md space-y-6 border-2 border-[var(--border-subtle)]">
        <div className="text-center">
          <h1 className="page-title text-2xl">Choose a new password</h1>
          <p className="page-subtitle mt-1">Enter your new password below.</p>
        </div>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}

        <form action={updatePassword} className="space-y-4">
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Min. 8 characters"
          />
          <Field
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Repeat password"
          />
          <SubmitButton className="w-full" pendingLabel="Updating…">Update password</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
