import { AuthCard } from "@/ui/auth-card";
import { SignInForm } from "./sign-in-form";

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ restablecida?: string }>;
}) {
  const { restablecida } = await searchParams;
  return (
    <AuthCard title="Iniciar sesión">
      <SignInForm reset={restablecida === "1"} />
    </AuthCard>
  );
}
