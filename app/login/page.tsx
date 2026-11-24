import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { sanitizeNextPath } from "@/lib/redirect";
import { getSession } from "@/lib/session";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeNextPath(params.next);
  const session = await getSession();

  if (session) {
    redirect(next ?? "/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#171b21] px-4 py-12 text-[#f1f1ed] sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#a8d889] text-xl font-bold text-[#243020]">
            L
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            Lyfter Badges
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#9ca3af]">
            Sign in to keep the badges you collect tied to your account and
            track your progress across events.
          </p>
        </div>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
