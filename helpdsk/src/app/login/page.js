"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BadgeHelp, LockKeyhole, Mail, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { pb, signIn } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";

function friendlyError(error) {
  if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) return "Brakuje adresu PocketBase. Dodaj NEXT_PUBLIC_POCKETBASE_URL w ustawieniach aplikacji.";
  if (!error?.status) return "Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.";
  return "Nieprawidłowy e-mail lub hasło.";
}

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  useEffect(() => { if (pb.authStore.isValid) router.replace("/"); }, [router]);

  async function submit(values) {
    setServerError(""); setSubmitting(true);
    try { await signIn(values.email, values.password); router.replace("/"); }
    catch (error) { setServerError(friendlyError(error)); }
    finally { setSubmitting(false); }
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
      <form onSubmit={form.handleSubmit(submit)} className="form-stack" noValidate>
        <Field label="Adres e-mail" error={form.formState.errors.email?.message}>
          <div className="input-icon"><Mail size={17} /><Input autoComplete="email" type="email" placeholder="uczen@szkola.pl" {...form.register("email")} /></div>
        </Field>
        <Field label="Hasło" error={form.formState.errors.password?.message}>
          <div className="input-icon"><LockKeyhole size={17} /><Input autoComplete="current-password" type="password" placeholder="Wpisz swoje hasło" {...form.register("password")} /></div>
        </Field>
        {serverError && <p className="form-alert" role="alert">{serverError}</p>}
        <Button type="submit" disabled={submitting} className="auth-submit">{submitting ? "Logowanie…" : "Zaloguj się"}<ArrowRight size={17} /></Button>
      </form>
      <p className="auth-switch">Nie masz jeszcze konta? <Link href="/register">Utwórz konto</Link></p>
      <div className="auth-foot"><span>© 2026 Szkolny Helpdesk</span><span>System zgłoszeń szkolnych</span></div>
    </div></section>
  </main>;
}
