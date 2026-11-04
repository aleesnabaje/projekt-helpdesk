"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zaloguj } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [blad, setBlad] = useState("");
  const [laduje, setLaduje] = useState(false);

  async function wyslijFormularz(e) {
    e.preventDefault(); // żeby strona się nie przeładowała
    setBlad("");

    // proste sprawdzenie danych
    if (!email.includes("@")) {
      setBlad("Niepoprawny email.");
      return;
    }
    if (password === "") {
      setBlad("Podaj hasło.");
      return;
    }

    setLaduje(true);
    try {
      await zaloguj(email, password);
      router.push("/");
    } catch (error) {
      setBlad(error.message);
    }
    setLaduje(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Logowanie</h1>

      <form onSubmit={wyslijFormularz} className="flex flex-col gap-4">
        {blad && <p className="text-sm text-red-500">{blad}</p>}

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

        <button
          type="submit"
          disabled={laduje}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {laduje ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>

      <p className="text-sm">
        Nie masz konta?{" "}
        <Link href="/register" className="underline">
          Zarejestruj się
        </Link>
      </p>
    </main>
  );
}
