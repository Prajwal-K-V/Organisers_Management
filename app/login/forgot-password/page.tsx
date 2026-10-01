import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { humanizeLoginError } from "@/lib/login-errors";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = humanizeLoginError(params.error);
  const successMessage = params.message ? decodeURIComponent(params.message) : null;

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50 via-[#fffbf5] to-red-50"
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-md space-y-6 border-2 border-[var(--border-subtle)]">
        <div className="text-center">
          <h1 className="page-title text-2xl">Reset password</h1>
          <p className="page-subtitle mt-1">We&apos;ll email you a link to choose a new password.</p>
        </div>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}
        {successMessage && <p className="alert-success">{successMessage}</p>}

        <form action={requestPasswordReset} className="space-y-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          <SubmitButton className="w-full" pendingLabel="Sending…">Send reset link</SubmitButton>
        </form>

        <p className="text-center text-sm">
          <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
