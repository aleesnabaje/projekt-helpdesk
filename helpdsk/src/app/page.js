"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pobierzUzytkownika, wyloguj } from "@/lib/api";

// Na razie strona główna tylko pokazuje kto jest zalogowany.
// Później będą tu zgłoszenia.
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const zalogowany = pobierzUzytkownika();
    if (!zalogowany) {
      router.replace("/login"); // nikt nie jest zalogowany
      return;
    }
    setUser(zalogowany);
  }, [router]);

  function kliknijWyloguj() {
    wyloguj();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Szkolny Helpdesk</h1>
      <p>
        Zalogowano jako <strong>{user.email}</strong> (
        {user.role === "technician" ? "technik" : "użytkownik"})
      </p>
      <div>
        <button onClick={kliknijWyloguj} className="rounded border p-2">
          Wyloguj
        </button>
      </div>
    </main>
  );
}
