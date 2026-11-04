// Adres PocketBase bierzemy ze zmiennej środowiskowej (nie wpisujemy na sztywno)
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL;

// Wysyła zapytanie POST do PocketBase i zwraca odpowiedź jako obiekt
async function wyslij(sciezka, dane) {
  let odpowiedz;
  try {
    odpowiedz = await fetch(PB_URL + sciezka, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dane),
    });
  } catch (e) {
    // fetch rzuca błąd, gdy serwer w ogóle nie odpowiada
    throw new Error("Brak połączenia z serwerem.");
  }

  const wynik = await odpowiedz.json();
  if (!odpowiedz.ok) {
    throw new Error(wyciagnijBlad(wynik));
  }
  return wynik;
}

// PocketBase zwraca błędy w polu "data", np. { email: { code: "...", message: "..." } }
function wyciagnijBlad(wynik) {
  const pola = wynik.data || {};
  if (pola.email && pola.email.code === "validation_not_unique") {
    return "Ten email jest już zajęty.";
  }
  const pierwszePole = Object.keys(pola)[0];
  if (pierwszePole) {
    return pola[pierwszePole].message;
  }
  return "Coś poszło nie tak. Spróbuj ponownie.";
}

// Rejestracja: tworzy rekord w kolekcji users
// (roli nie wysyłamy - technika ustawia admin w panelu PocketBase)
export async function zarejestruj(name, email, password, passwordConfirm) {
  return wyslij("/api/collections/users/records", {
    name,
    email,
    password,
    passwordConfirm,
  });
}

// Logowanie: PocketBase zwraca token i dane użytkownika, zapisujemy je w przeglądarce
export async function zaloguj(email, password) {
  let wynik;
  try {
    wynik = await wyslij("/api/collections/users/auth-with-password", {
      identity: email,
      password,
    });
  } catch (e) {
    if (e.message === "Brak połączenia z serwerem.") throw e;
    throw new Error("Zły email lub hasło.");
  }
  localStorage.setItem("token", wynik.token);
  localStorage.setItem("user", JSON.stringify(wynik.record));
  return wynik.record;
}

// Zwraca zalogowanego użytkownika albo null (wywołuj tylko w useEffect)
export function pobierzUzytkownika() {
  const tekst = localStorage.getItem("user");
  if (!tekst) return null;
  return JSON.parse(tekst);
}

export function wyloguj() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
