import AuthForm from "@/components/auth/AuthForm";
import { sanitizeNextPath } from "@/utils/account-model";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-[18px] py-[24px]"
      style={{ width: "402px", maxWidth: "100vw", margin: "0 auto" }}
    >
      <div className="w-full max-w-[370px]">
        <AuthForm message={message} nextPath={nextPath} />
      </div>
    </div>
  );
}
