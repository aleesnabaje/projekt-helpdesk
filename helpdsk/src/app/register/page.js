"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BadgeHelp, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signUp } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", passwordConfirm: "" } });

  async function submit(values) {
    setServerError(""); setSubmitting(true);
    try {
      await signUp(values.name, values.email, values.password, values.passwordConfirm);
      router.replace("/");
    } catch (error) {
      if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) setServerError("Brakuje adresu PocketBase. Dodaj NEXT_PUBLIC_POCKETBASE_URL w ustawieniach aplikacji.");
      else if (error?.status === 400 && error?.data?.data?.email) setServerError("Konto z tym adresem e-mail już istnieje.");
      else if (!error?.status) setServerError("Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.");
      else setServerError("Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.");
    } finally { setSubmitting(false); }
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
      <form onSubmit={form.handleSubmit(submit)} className="form-stack" noValidate>
        <Field label="Imię i nazwisko" error={form.formState.errors.name?.message}><div className="input-icon"><UserRound size={17} /><Input autoComplete="name" placeholder="Jan Kowalski" {...form.register("name")} /></div></Field>
        <Field label="Adres e-mail" error={form.formState.errors.email?.message}><div className="input-icon"><Mail size={17} /><Input autoComplete="email" type="email" placeholder="uczen@szkola.pl" {...form.register("email")} /></div></Field>
        <div className="form-row">
          <Field label="Hasło" error={form.formState.errors.password?.message}><div className="input-icon"><LockKeyhole size={17} /><Input autoComplete="new-password" type="password" placeholder="Min. 8 znaków" {...form.register("password")} /></div></Field>
          <Field label="Powtórz hasło" error={form.formState.errors.passwordConfirm?.message}><div className="input-icon"><LockKeyhole size={17} /><Input autoComplete="new-password" type="password" placeholder="Wpisz ponownie" {...form.register("passwordConfirm")} /></div></Field>
        </div>
        {serverError && <p className="form-alert" role="alert">{serverError}</p>}
        <Button type="submit" disabled={submitting} className="auth-submit">{submitting ? "Tworzenie konta…" : "Utwórz konto"}<ArrowRight size={17} /></Button>
      </form>
      <p className="auth-switch">Masz już konto? <Link href="/login">Zaloguj się</Link></p>
      <div className="auth-foot"><span>© 2026 Szkolny Helpdesk</span><span>System zgłoszeń szkolnych</span></div>
    </div></section>
  </main>;
}
