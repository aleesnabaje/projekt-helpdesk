"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Zasady walidacji formularza
const schema = z.object({
  email: z.string().min(1, "Podaj email").email("Niepoprawny email"),
  password: z.string().min(1, "Podaj hasło"),
});

export default function LoginPage() {
  const router = useRouter();
  const [blad, setBlad] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(dane) {
    setBlad("");
    try {
      // logowanie w PocketBase
      await pb.collection("users").authWithPassword(dane.email, dane.password);
      router.push("/");
    } catch (error) {
      setBlad("Zły email lub hasło.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Logowanie</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {blad && <p className="text-sm text-red-500">{blad}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Hasło</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>
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
