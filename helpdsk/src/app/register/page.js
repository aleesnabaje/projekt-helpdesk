"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zarejestruj, zaloguj } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [blad, setBlad] = useState("");
  const [laduje, setLaduje] = useState(false);

  // Sprawdza dane i zwraca tekst błędu (pusty tekst = wszystko OK)
  function sprawdzDane() {
    if (name.trim().length < 2) return "Imię musi mieć min. 2 znaki.";
    if (!email.includes("@")) return "Niepoprawny email.";
    if (password.length < 8) return "Hasło musi mieć min. 8 znaków.";
    if (password !== passwordConfirm) return "Hasła nie są takie same.";
    return "";
  }

  async function wyslijFormularz(e) {
    e.preventDefault();

    const komunikat = sprawdzDane();
    if (komunikat !== "") {
      setBlad(komunikat);
      return;
    }

    setBlad("");
    setLaduje(true);
    try {
      await zarejestruj(name, email, password, passwordConfirm);
      await zaloguj(email, password); // od razu logujemy
      router.push("/");
    } catch (error) {
      setBlad(error.message);
    }
    setLaduje(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>

      <form onSubmit={wyslijFormularz} className="flex flex-col gap-4">
        {blad && <p className="text-sm text-red-500">{blad}</p>}

        <label className="flex flex-col gap-1">
          Imię
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border p-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          Powtórz hasło
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="rounded border p-2"
          />
        </label>

        <button
          type="submit"
          disabled={laduje}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {laduje ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>

      <p className="text-sm">
        Masz już konto?{" "}
        <Link href="/login" className="underline">
          Zaloguj się
        </Link>
      </p>
    </main>
  );
}
