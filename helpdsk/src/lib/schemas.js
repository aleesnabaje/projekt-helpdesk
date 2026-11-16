import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Wpisz poprawny adres e-mail."),
  password: z.string().min(1, "Wpisz hasło."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Imię i nazwisko muszą mieć co najmniej 2 znaki."),
  email: z.string().trim().email("Wpisz poprawny adres e-mail."),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków."),
  passwordConfirm: z.string().min(1, "Powtórz hasło."),
}).refine((values) => values.password === values.passwordConfirm, {
  message: "Hasła nie są takie same.",
  path: ["passwordConfirm"],
});

export const ticketSchema = z.object({
  title: z.string().trim().min(4, "Tytuł musi mieć co najmniej 4 znaki.").max(100, "Tytuł może mieć maksymalnie 100 znaków."),
  description: z.string().trim().min(10, "Opisz usterkę w co najmniej 10 znakach.").max(2000, "Opis może mieć maksymalnie 2000 znaków."),
  room: z.string().min(1, "Wybierz salę."),
  category: z.string().min(1, "Wybierz kategorię."),
  priority: z.string().min(1, "Wybierz priorytet."),
  photo: z.any().optional()
    .refine((files) => !files?.length || ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(files[0].type), "Załącz plik JPG, PNG, WebP lub GIF.")
    .refine((files) => !files?.length || files[0].size <= 5 * 1024 * 1024, "Zdjęcie może mieć maksymalnie 5 MB."),
});

export const statusSchema = z.object({
  status: z.enum(["Nowe", "W realizacji", "Zamknięte"]),
  comment: z.string().trim().max(1000, "Komentarz może mieć maksymalnie 1000 znaków.").optional(),
});
