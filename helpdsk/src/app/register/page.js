"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BadgeHelp, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button as Przycisk } from "@/components/ui/button";
import { Field as PoleFormularza, Input as PoleTekstowe } from "@/components/ui/field";
import { signUp } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";
function StronaRejestracji() {
  const nawigacja = useRouter();
  const [bladSerwera, ustawBladSerwera] = useState("");
  const [wysylanie, ustawWysylanie] = useState(false);
  const formularz = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: ""
    }
  });
  async function wyslijFormularz(dane) {
    ustawBladSerwera("");
    ustawWysylanie(true);
    try {
      await signUp(dane.name, dane.email, dane.password, dane.passwordConfirm);
      nawigacja.replace("/");
    } catch (blad) {
      if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) ustawBladSerwera("Brakuje adresu PocketBase. Dodaj NEXT_PUBLIC_POCKETBASE_URL w ustawieniach aplikacji.");else if (blad?.status === 400 && blad?.data?.data?.email) ustawBladSerwera("Konto z tym adresem e-mail już istnieje.");else if (!blad?.status) ustawBladSerwera("Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.");else ustawBladSerwera("Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.");
    } finally {
      ustawWysylanie(false);
    }
  }
  return <main className="auth-shell">
    <section className="auth-aside">
      <Link href="/login" className="brand brand-light"><span className="brand-mark"><BadgeHelp size={21} /></span> szkolny<span>helpdesk</span></Link>
      <div className="aside-copy"><span className="eyebrow eyebrow-light">TWOJA SZKOŁA. SPRAWNIEJSZA.</span><h1>Małe zgłoszenie,<br />duża różnica.</h1><p>Załóż konto, aby w kilka chwil zgłosić problem i na bieżąco sprawdzać, co dzieje się z usterką.</p></div>
      <div className="aside-note"><UserRound size={18} /><span>Jedno konto wystarczy, aby śledzić wszystkie swoje zgłoszenia.</span></div>
      <div className="aside-orb orb-one" /><div className="aside-orb orb-two" />
    </section>
    <section className="auth-main"><div className="auth-card">
      <div className="auth-mobile-brand"><span className="brand-mark"><BadgeHelp size={19} /></span> szkolny<span>helpdesk</span></div>
      <span className="eyebrow">DOŁĄCZ DO NAS</span><h2>Utwórz konto</h2><p className="auth-intro">Zarejestruj się i zgłaszaj usterki w swojej szkole.</p>
      <form onSubmit={formularz.handleSubmit(wyslijFormularz)} className="form-stack" noValidate>
        <PoleFormularza label="Imię i nazwisko" error={formularz.formState.errors.name?.message}><div className="input-icon"><UserRound size={17} /><PoleTekstowe autoComplete="name" placeholder="Jan Kowalski" {...formularz.register("name")} /></div></PoleFormularza>
        <PoleFormularza label="Adres e-mail" error={formularz.formState.errors.email?.message}><div className="input-icon"><Mail size={17} /><PoleTekstowe autoComplete="email" type="email" placeholder="uczen@szkola.pl" {...formularz.register("email")} /></div></PoleFormularza>
        <div className="form-row">
          <PoleFormularza label="Hasło" error={formularz.formState.errors.password?.message}><div className="input-icon"><LockKeyhole size={17} /><PoleTekstowe autoComplete="new-password" type="password" placeholder="Min. 8 znaków" {...formularz.register("password")} /></div></PoleFormularza>
          <PoleFormularza label="Powtórz hasło" error={formularz.formState.errors.passwordConfirm?.message}><div className="input-icon"><LockKeyhole size={17} /><PoleTekstowe autoComplete="new-password" type="password" placeholder="Wpisz ponownie" {...formularz.register("passwordConfirm")} /></div></PoleFormularza>
        </div>
        {bladSerwera && <p className="form-alert" role="alert">{bladSerwera}</p>}
        <Przycisk type="submit" disabled={wysylanie} className="auth-submit">{wysylanie ? "Tworzenie konta…" : "Utwórz konto"}<ArrowRight size={17} /></Przycisk>
      </form>
      <p className="auth-switch">Masz już konto? <Link href="/login">Zaloguj się</Link></p>
      <div className="auth-foot"><span>© 2026 Szkolny Helpdesk</span><span>System zgłoszeń szkolnych</span></div>
    </div></section>
  </main>;
}
export { StronaRejestracji as default };
