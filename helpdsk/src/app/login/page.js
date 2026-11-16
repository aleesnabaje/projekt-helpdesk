"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BadgeHelp, LockKeyhole, Mail, Wrench } from "lucide-react";
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
  return <main className="auth-shell">
    <section className="auth-aside">
      <Link href="/login" className="brand brand-light"><span className="brand-mark"><BadgeHelp size={21} /></span> szkolny<span>helpdesk</span></Link>
      <div className="aside-copy"><span className="eyebrow eyebrow-light">SZYBKO. PROSTO. W JEDNYM MIEJSCU.</span><h1>Razem zadbajmy<br />o sprawną szkołę.</h1><p>Zgłoś usterkę, a szkolny technik zajmie się resztą. Każde zgłoszenie ma swój status i historię.</p></div>
      <div className="aside-note"><Wrench size={18} /><span>Masz problem ze sprzętem? Jesteś w dobrym miejscu.</span></div>
      <div className="aside-orb orb-one" /><div className="aside-orb orb-two" />
    </section>
    <section className="auth-main"><div className="auth-card">
      <div className="auth-mobile-brand"><span className="brand-mark"><BadgeHelp size={19} /></span> szkolny<span>helpdesk</span></div>
      <span className="eyebrow">WITAMY PONOWNIE</span><h2>Zaloguj się</h2><p className="auth-intro">Zaloguj się, aby zgłaszać i śledzić usterki w szkole.</p>
      <form onSubmit={formularz.handleSubmit(wyslijFormularz)} className="form-stack" noValidate>
        <PoleFormularza label="Adres e-mail" error={formularz.formState.errors.email?.message}>
          <div className="input-icon"><Mail size={17} /><PoleTekstowe autoComplete="email" type="email" placeholder="uczen@szkola.pl" {...formularz.register("email")} /></div>
        </PoleFormularza>
        <PoleFormularza label="Hasło" error={formularz.formState.errors.password?.message}>
          <div className="input-icon"><LockKeyhole size={17} /><PoleTekstowe autoComplete="current-password" type="password" placeholder="Wpisz swoje hasło" {...formularz.register("password")} /></div>
        </PoleFormularza>
        {bladSerwera && <p className="form-alert" role="alert">{bladSerwera}</p>}
        <Przycisk type="submit" disabled={wysylanie} className="auth-submit">{wysylanie ? "Logowanie…" : "Zaloguj się"}<ArrowRight size={17} /></Przycisk>
      </form>
      <p className="auth-switch">Nie masz jeszcze konta? <Link href="/register">Utwórz konto</Link></p>
      <div className="auth-foot"><span>© 2026 Szkolny Helpdesk</span><span>System zgłoszeń szkolnych</span></div>
    </div></section>
  </main>;
}
export { StronaLogowania as default };
