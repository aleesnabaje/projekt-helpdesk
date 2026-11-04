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
const schema = z
  .object({
    name: z.string().min(2, "Imię musi mieć min. 2 znaki"),
    email: z.string().min(1, "Podaj email").email("Niepoprawny email"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
    passwordConfirm: z.string().min(1, "Powtórz hasło"),
  })
  .refine((dane) => dane.password === dane.passwordConfirm, {
    message: "Hasła nie są takie same",
    path: ["passwordConfirm"],
  });

export default function RegisterPage() {
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
      // zakładamy konto (roli nie wysyłamy - technika ustawia admin w PocketBase)
      await pb.collection("users").create({
        name: dane.name,
        email: dane.email,
        password: dane.password,
        passwordConfirm: dane.passwordConfirm,
      });
      // od razu logujemy
      await pb.collection("users").authWithPassword(dane.email, dane.password);
      router.push("/");
    } catch (error) {
      setBlad("Nie udało się założyć konta. Może ten email jest już zajęty?");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Rejestracja</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {blad && <p className="text-sm text-red-500">{blad}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Imię</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="passwordConfirm">Powtórz hasło</Label>
          <Input
            id="passwordConfirm"
            type="password"
            {...register("passwordConfirm")}
          />
          {errors.passwordConfirm && (
            <p className="text-sm text-red-500">
              {errors.passwordConfirm.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Tworzenie konta..." : "Zarejestruj się"}
        </Button>
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
