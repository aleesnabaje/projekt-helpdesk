import PocketBase from "pocketbase";

const adresPocketBase = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const kolekcjaZgloszen = "problemy";
const kolekcjaHistorii = "ticket_events";
const rolaTechnika = "technik";

export const baza = new PocketBase(adresPocketBase || "https://db.ilaskowski.store");
baza.autoCancellation(false);

export const kategorie = ["Sprzęt komputerowy", "Multimedia", "Instalacje", "Inne"];
export const priorytety = ["Niski", "Średni", "Wysoki"];
export const statusy = ["Nowe", "W realizacji", "Zamknięte"];
export const sale = ["1", "2", "3", "4", "5", "6", "7", "8", "67"];

function dopasujWartosc(wartosc, mozliweWartosci) {
  return mozliweWartosci.find((element) => element.toLocaleLowerCase("pl-PL") === String(wartosc || "").toLocaleLowerCase("pl-PL")) || wartosc;
}

function dopasujStatus(wartosc) {
  if (["zamkniete", "zamknięte"].includes(String(wartosc || "").toLocaleLowerCase("pl-PL"))) return "Zamknięte";
  return dopasujWartosc(wartosc, statusy);
}

function przygotujZgloszenie(rekord) {
  return {
    ...rekord,
    title: rekord.tytul,
    description: rekord.opis,
    room: rekord.sala,
    kategoria: dopasujWartosc(rekord.kategoria, kategorie),
    category: dopasujWartosc(rekord.kategoria, kategorie),
    priorytet: dopasujWartosc(rekord.priorytet, priorytety),
    priority: dopasujWartosc(rekord.priorytet, priorytety),
    status: dopasujStatus(rekord.status),
    photo: rekord.zdjecie,
    expand: rekord.expand || {},
  };
}

function przygotujUzytkownika(rekord) {
  return rekord ? { ...rekord, role: rekord.rola } : null;
}

export function aktualnyUzytkownik() {
  return baza.authStore.isValid ? przygotujUzytkownika(baza.authStore.record) : null;
}

export async function zaloguj(adresEmail, haslo) {
  const wynik = await baza.collection("users").authWithPassword(adresEmail, haslo);
  return przygotujUzytkownika(wynik.record);
}

export async function zarejestruj(imie, adresEmail, haslo, powtorzoneHaslo) {
  await baza.collection("users").create({
    name: imie,
    email: adresEmail,
    password: haslo,
    passwordConfirm: powtorzoneHaslo,
    rola: "user",
  });
  return zaloguj(adresEmail, haslo);
}

export async function pobierzZgloszenia(uzytkownik) {
  const filtr = uzytkownik.rola === rolaTechnika ? undefined : `autor = "${uzytkownik.id}"`;
  const rekordy = await baza.collection(kolekcjaZgloszen).getFullList({
    sort: "-created",
    ...(filtr ? { filter: filtr } : {}),
  });
  return rekordy.map(przygotujZgloszenie);
}

export function dodajZgloszenie(dane) {
  const rekord = {
    autor: aktualnyUzytkownik().id,
    tytul: dane.tytul,
    opis: dane.opis,
    sala: dane.sala,
    kategoria: String(dane.kategoria).toLocaleLowerCase("pl-PL"),
    priorytet: String(dane.priorytet).toLocaleLowerCase("pl-PL"),
    status: "nowe",
  };
  if (dane.zdjecie) rekord.zdjecie = dane.zdjecie;
  return baza.collection(kolekcjaZgloszen).create(rekord);
}

export function obserwujZgloszenia(poZmianie) {
  return baza.collection(kolekcjaZgloszen).subscribe("*", poZmianie);
}

export async function zmienStatusZgloszenia(id, { status, komentarz, poprzedniStatus }) {
  const nowyStatus = String(status).toLocaleLowerCase("pl-PL");
  const zaktualizowanyRekord = await baza.collection(kolekcjaZgloszen).update(id, {
    status: nowyStatus,
  });
  try {
    await baza.collection(kolekcjaHistorii).create({
      ticket: id,
      actor: aktualnyUzytkownik().id,
      from_status: dopasujStatus(poprzedniStatus).toLocaleLowerCase("pl-PL"),
      to_status: nowyStatus,
      comment: komentarz || "",
    });
  } catch (blad) {
    const bladHistorii = new Error("Status został zmieniony, ale nie udało się zapisać historii. Sprawdź kolekcję ticket_events i jej regułę Create.");
    bladHistorii.etap = "historia";
    bladHistorii.cause = blad;
    throw bladHistorii;
  }
  return przygotujZgloszenie(zaktualizowanyRekord);
}

export async function pobierzHistorie(idZgloszenia) {
  const rekordy = await baza.collection(kolekcjaHistorii).getFullList({
    filter: `ticket = "${idZgloszenia}"`,
    sort: "created",
    expand: "actor",
  });
  return rekordy.map((wpis) => ({
    ...wpis,
    from_status: wpis.from_status ? dopasujStatus(wpis.from_status) : "",
    to_status: dopasujStatus(wpis.to_status),
  }));
}

export function wyloguj() {
  baza.authStore.clear();
}

export async function pobierzAdresZdjecia(zgloszenie, miniatura = "800x600") {
  if (!zgloszenie?.zdjecie) return null;
  const token = await baza.files.getToken();
  return baza.files.getURL(zgloszenie, zgloszenie.zdjecie, { thumb: miniatura, token });
}

export const pb = baza;
export const categories = kategorie;
export const priorities = priorytety;
export const statuses = statusy;
export const rooms = sale;
export const currentUser = aktualnyUzytkownik;
export const signIn = zaloguj;
export const signUp = zarejestruj;
export const listTickets = pobierzZgloszenia;
export const createTicket = (dane) => dodajZgloszenie({
  tytul: dane.title,
  opis: dane.description,
  sala: dane.room,
  kategoria: dane.category,
  priorytet: dane.priority,
  zdjecie: dane.photo,
});
export const subscribeTickets = obserwujZgloszenia;
export const updateTicket = (id, dane) => zmienStatusZgloszenia(id, {
  status: dane.status,
  komentarz: dane.comment,
  poprzedniStatus: dane.fromStatus,
});
export const getEvents = pobierzHistorie;
export const signOut = wyloguj;
export const ticketImageUrl = (zgloszenie, miniatura) => pobierzAdresZdjecia({ ...zgloszenie, zdjecie: zgloszenie.zdjecie || zgloszenie.photo }, miniatura);
