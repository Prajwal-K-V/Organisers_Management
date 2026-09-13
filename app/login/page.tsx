import { LoginPanel } from "@/components/login-panel";
import { Card } from "@/components/ui/card";
import { humanizeLoginError } from "@/lib/login-errors";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = humanizeLoginError(params.error);
  const successMessage = params.message ? decodeURIComponent(params.message) : null;

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-50 via-[#fffbf5] to-red-50" aria-hidden />
      <Card className="relative z-10 w-full max-w-md space-y-6 border-2 border-[var(--border-subtle)]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-lg font-bold text-white shadow-lg">
            OM
          </div>
          <h1 className="page-title text-2xl">Organisers Management</h1>
          <p className="page-subtitle mt-1">Sign in to manage tournaments and auctions</p>
        </div>

        {errorMessage && <p className="alert-error">{errorMessage}</p>}
        {successMessage && <p className="alert-success">{successMessage}</p>}

        <LoginPanel />
      </Card>
    </div>
  );
}
