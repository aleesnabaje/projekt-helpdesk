"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeHelp } from "lucide-react";
import { Button as Przycisk } from "@/components/ui/button";
import { Field as PoleFormularza, Input as PoleTekstowe } from "@/components/ui/field";
import { pb, signIn } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";
function czytelnyBlad(blad) {
  if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) return "Brakuje adresu PocketBase. Dodaj NEXT_PUBLIC_POCKETBASE_URL w ustawieniach aplikacji.";
  if (!blad?.status) return "Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.";
  return "Nieprawidłowy e-mail lub hasło.";
}
function StronaLogowania() {
  const nawigacja = useRouter();
  const [bladSerwera, ustawBladSerwera] = useState("");
  const [wysylanie, ustawWysylanie] = useState(false);
  const formularz = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  useEffect(() => {
    if (pb.authStore.isValid) nawigacja.replace("/");
  }, [nawigacja]);
  async function wyslijFormularz(dane) {
    ustawBladSerwera("");
    ustawWysylanie(true);
    try {
      await signIn(dane.email, dane.password);
      nawigacja.replace("/");
    } catch (blad) {
      ustawBladSerwera(czytelnyBlad(blad));
    } finally {
      ustawWysylanie(false);
    }
  }
  return <main className="login-page min-h-screen flex items-center justify-center p-6 bg-slate-100">
    <section className="login-card w-full max-w-md border border-slate-300 bg-white p-7">
      <div className="login-brand mb-7 flex items-center gap-2 font-semibold text-slate-900"><span className="brand-mark"><BadgeHelp size={18} /></span><span>Szkolny helpdesk</span></div>
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Logowanie</h1>
      <p className="login-intro mb-6 text-sm text-slate-600">Zaloguj się, aby sprawdzić swoje zgłoszenia.</p>
      <form onSubmit={formularz.handleSubmit(wyslijFormularz)} className="form-stack" noValidate>
        <PoleFormularza label="Adres e-mail" error={formularz.formState.errors.email?.message}>
          <PoleTekstowe autoComplete="email" type="email" placeholder="uczen@szkola.pl" {...formularz.register("email")} />
        </PoleFormularza>
        <PoleFormularza label="Hasło" error={formularz.formState.errors.password?.message}>
          <PoleTekstowe autoComplete="current-password" type="password" placeholder="Wpisz hasło" {...formularz.register("password")} />
        </PoleFormularza>
        {bladSerwera && <p className="form-alert" role="alert">{bladSerwera}</p>}
        <Przycisk type="submit" disabled={wysylanie} className="login-submit auth-submit">{wysylanie ? "Logowanie..." : "Zaloguj się"}</Przycisk>
      </form>
      <p className="auth-switch mt-5 text-center text-sm text-slate-600">Nie masz jeszcze konta? <Link href="/register">Utwórz konto</Link></p>
    </section>
  </main>;
}
export { StronaLogowania as default };
