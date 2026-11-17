# Szkolny Helpdesk

Responsywna aplikacja do zgłaszania i obsługi usterek szkolnych. Użytkownik tworzy zgłoszenie, dodaje opcjonalne zdjęcie i śledzi status. Technik widzi zgłoszenia całej szkoły, zmienia statusy, dodaje komentarze, korzysta z filtrów i podsumowań, a lista odświeża się przez PocketBase Realtime.

## Technologie

- Next.js App Router i JavaScript
- shadcn/ui (konfiguracja JavaScript w `components.json`, komponenty w `src/components/ui`), Tailwind CSS 4
- PocketBase jako osobna usługa
- React Hook Form + Zod
- Wariant wdrożenia: GitHub i ręczny przycisk **Redeploy** w Coolify


## Zrzuty ekranu

Dodaj zrzuty widoków logowania, zgłoszeń użytkownika i panelu technika do `docs/screenshots/` po wdrożeniu i utworzeniu kont testowych.

## Uruchomienie lokalne

Wymagane: Node.js 22 lub nowszy oraz działająca instancja PocketBase.

1. Skopiuj `helpdsk/.env.example` do `helpdsk/.env.local`.
2. Ustaw publiczny adres PocketBase:

   ```env
   NEXT_PUBLIC_POCKETBASE_URL=https://db.ilaskowski.store
   ```

3. W terminalu wejdź do katalogu `helpdsk` i uruchom:

   ```bash
   npm ci
   npm run dev
   ```

4. Otwórz `http://localhost:3000`.

`NEXT_PUBLIC_POCKETBASE_URL` jest wbudowywany do aplikacji przeglądarkowej podczas kompilacji. Po jego zmianie trzeba ponownie zbudować aplikację.

## Kolekcje PocketBase

Aplikacja korzysta z istniejących kolekcji `users` i `problemy`. Pole `users.name` już istnieje. Rola jest w polu `rola`, typu select, z opcjami `user` i `technik`. Rejestracja wysyła jawnie `rola: "user"`; tylko superuser może później zmienić tę wartość.

W `problemy` aplikacja używa pól:

- `autor` — text, wymagane; aplikacja zapisuje tu identyfikator PocketBase zalogowanego użytkownika
- `tytul` — text, wymagane, max. 100 znaków
- `opis` — text, wymagane, max. 2000 znaków
- `sala` — select: `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `67`
- `kategoria` — select: `sprzęt komputerowy`, `multimedia`, `instalacje`, `inne`
- `priorytet` — select: `niski`, `średni`, `wysoki`
- `status` — select: `nowe`, `w realizacji`, `zamknięte`; domyślnie `nowe`
- `zdjecie` — file, jeden plik, maks. 5 MB, dozwolone MIME `image/jpeg`, `image/png`, `image/webp`, `image/gif`; włącz **Protected**

Wartości select muszą odpowiadać powyższym zapisom. Mapowanie znajduje się w `helpdsk/src/lib/api.js`.

Utwórz kolekcję `ticket_events` (Base):

- `ticket` — relation do `problemy`, pojedynczy wybór, wymagane
- `actor` — relation do `users`, pojedynczy wybór, wymagane
- `from_status` — text
- `to_status` — text, wymagane
- `comment` — text

## Reguły API PocketBase

Reguły trzeba poprawić w **Settings → Collections → [kolekcja] → API Rules**. Puste pole oznacza dostęp publiczny; zablokowana reguła jest dostępna tylko superuserowi. PocketBase stosuje reguły także do zapytań API, więc interfejs nie jest jedyną ochroną.

### `users`

- List: `id = @request.auth.id`
- View: `@request.auth.id != "" && (id = @request.auth.id || rola = "technik")`
- Create: `@request.body.rola = "user"`
- Update: `id = @request.auth.id && @request.body.rola:isset = false`
- Delete: zablokowane
- Manage: zablokowane

Reguła View pozwala zalogowanym zobaczyć własny profil oraz profil technika w historii. Reguła Update blokuje użytkownikowi zmianę własnej roli; istniejąca reguła `id = @request.auth.id` pozwalała na jej zmianę i należy ją zastąpić. Pole `autor` w `problemy` jest tekstem, więc aplikacja zapisuje identyfikator użytkownika bez rozwijania relacji.

### `problemy`

- List: `@request.auth.id != "" && (autor = @request.auth.id || @request.auth.rola = "technik")`
- View: `@request.auth.id != "" && (autor = @request.auth.id || @request.auth.rola = "technik")`
- Create: `@request.auth.id != "" && @request.body.autor = @request.auth.id && @request.body.status = "nowe"`
- Update: `@request.auth.rola = "technik" && @request.body.tytul:isset = false && @request.body.opis:isset = false && @request.body.sala:isset = false && @request.body.kategoria:isset = false && @request.body.priorytet:isset = false && @request.body.autor:isset = false && @request.body.zdjecie:isset = false`
- Delete: zablokowane

Przekazana reguła `View` wyglądała na kopię reguły `Create` i odwoływała się do `@request.body`. Zastąp ją regułą View powyżej. Usuń z Create warunek dotyczący `komentarz:isset`, jeśli pole to nie istnieje w kolekcji.

### `ticket_events`

- List: `@request.auth.id != "" && (ticket.autor = @request.auth.id || @request.auth.rola = "technik")`
- View: `@request.auth.id != "" && (ticket.autor = @request.auth.id || @request.auth.rola = "technik")`
- Create: `@request.auth.rola = "technik" && actor = @request.auth.id`
- Update: zablokowane
- Delete: zablokowane

Komentarze technika są zapisywane w `ticket_events.comment`, nie w kolekcji `problemy`. Włączone **Protected** przy zdjęciu wymaga tokenu PocketBase do pobrania pliku. Aplikacja uzyskuje go po zalogowaniu, a uprawnienie do rekordu nadal rozstrzygają reguły PocketBase.

## Wdrożenie

### PocketBase w Coolify

1. Uruchom PocketBase jako osobną usługę na VPS.
2. Zamontuj trwały wolumen hosta do `/pb/pb_data` w kontenerze i zachowaj go przy redeployu.
3. Wystaw PocketBase pod osobną domeną HTTPS i skonfiguruj proxy do portu 8090.
4. W panelu PocketBase utwórz superusera, uzupełnij pola i reguły powyżej oraz utwórz konto technika. Konto załóż przez formularz, potem jako superuser ustaw mu `rola=technik`.

### Next.js w Coolify — GitHub

1. Wypchnij repozytorium do GitHuba.
2. W Coolify utwórz **Application** z repozytorium i gałęzi `main`.
3. Ustaw katalog `helpdsk` jako Base Directory, aby Coolify użył znajdującego się tam `Dockerfile`.
4. Ustaw domenę aplikacji i włącz HTTPS.
5. Dodaj `NEXT_PUBLIC_POCKETBASE_URL` jako **Build Variable**, ustawiając publiczny adres PocketBase. Zmiana tej wartości wymaga ponownego buildu.
6. Wykonaj pierwszy deploy. Dalsze zmiany wdrażaj przyciskiem **Redeploy**.
7. Sprawdź oba konta, nowe zgłoszenie, filtry, status, komentarz i historię.

Nie commituj haseł, tokenów ani plików `.env`. `helpdsk/.env.example` zawiera tylko przykładową nazwę zmiennej.

## Konta testowe

Po wdrożeniu utwórz dwa konta demonstracyjne i uzupełnij tę sekcję przed oddaniem projektu:

- Użytkownik: `uzupełnij e-mail` / `uzupełnij hasło`
- Technik: `uzupełnij e-mail` / `uzupełnij hasło`

## Prezentacja (ok. 5 minut)

1. Zaloguj się jako użytkownik i utwórz zgłoszenie ze zdjęciem.
2. Pokaż, że użytkownik widzi wyłącznie własne zgłoszenia.
3. Zaloguj się jako technik; pokaż filtry, dashboard i listę odświeżaną na żywo.
4. Zmień status, dodaj komentarz i pokaż historię.
5. W PocketBase pokaż reguły API, a w Coolify usługi aplikacji i PocketBase oraz trwały wolumen.
