import PocketBase from "pocketbase";

const baseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const ticketsCollection = "problemy";
const eventsCollection = "ticket_events";
const technicianRole = "technik";

export const pb = new PocketBase(baseUrl || "http://127.0.0.1:8090");
pb.autoCancellation(false);

export const categories = ["Sprzęt komputerowy", "Multimedia", "Instalacje", "Inne"];
export const priorities = ["Niski", "Średni", "Wysoki"];
export const statuses = ["Nowe", "W realizacji", "Zamknięte"];
export const rooms = ["1", "2", "3", "4", "5", "6", "7", "8", "67"];

function normalizeChoice(value, choices) {
  return choices.find((choice) => choice.toLocaleLowerCase("pl-PL") === String(value || "").toLocaleLowerCase("pl-PL")) || value;
}

function normalizeStatus(value) {
  if (["zamkniete", "zamknięte"].includes(String(value || "").toLocaleLowerCase("pl-PL"))) return "Zamknięte";
  return normalizeChoice(value, statuses);
}

function normalizeTicket(record) {
  return {
    ...record,
    owner: record.autor,
    title: record.tytul,
    description: record.opis,
    category: normalizeChoice(record.kategoria, categories),
    priority: normalizeChoice(record.priorytet, priorities),
    photo: record.zdjecie,
    status: normalizeStatus(record.status),
    expand: record.expand || {},
  };
}

function normalizeUser(record) {
  return record ? { ...record, role: record.rola } : null;
}

export function currentUser() {
  return pb.authStore.isValid ? normalizeUser(pb.authStore.record) : null;
}

export async function signIn(email, password) {
  const result = await pb.collection("users").authWithPassword(email, password);
  return normalizeUser(result.record);
}

export async function signUp(name, email, password, passwordConfirm) {
  await pb.collection("users").create({ name, email, password, passwordConfirm, rola: "user" });
  return signIn(email, password);
}

export async function listTickets(user) {
  const filter = user.role === technicianRole ? undefined : `autor = "${user.id}"`;
  const records = await pb.collection(ticketsCollection).getFullList({
    sort: "-created",
    ...(filter ? { filter } : {}),
  });
  return records.map(normalizeTicket);
}

export function createTicket(data) {
  const files = data.photo;
  const record = {
    autor: currentUser().id,
    tytul: data.title,
    opis: data.description,
    sala: data.room,
    kategoria: String(data.category).toLocaleLowerCase("pl-PL"),
    priorytet: String(data.priority).toLocaleLowerCase("pl-PL"),
    status: "nowe",
  };
  if (files) record.zdjecie = files;
  return pb.collection(ticketsCollection).create(record);
}

export function subscribeTickets(onChange) {
  return pb.collection(ticketsCollection).subscribe("*", onChange);
}

export async function updateTicket(id, { status, comment, fromStatus }) {
  const nextStatus = String(status).toLocaleLowerCase("pl-PL");
  const updated = await pb.collection(ticketsCollection).update(id, {
    status: nextStatus,
  });
  try {
    await pb.collection(eventsCollection).create({
      ticket: id,
      actor: currentUser().id,
      from_status: normalizeStatus(fromStatus).toLocaleLowerCase("pl-PL"),
      to_status: nextStatus,
      comment: comment || "",
    });
  } catch (error) {
    const historyError = new Error("Status został zmieniony, ale nie udało się zapisać historii. Sprawdź kolekcję ticket_events i jej regułę Create.");
    historyError.stage = "history";
    historyError.cause = error;
    throw historyError;
  }
  return normalizeTicket(updated);
}

export async function getEvents(ticketId) {
  const records = await pb.collection(eventsCollection).getFullList({
    filter: `ticket = "${ticketId}"`,
    sort: "created",
    expand: "actor",
  });
  return records.map((event) => ({
    ...event,
    from_status: event.from_status ? normalizeStatus(event.from_status) : "",
    to_status: normalizeStatus(event.to_status),
  }));
}

export function signOut() {
  pb.authStore.clear();
}

export async function ticketImageUrl(ticket, thumb = "800x600") {
  if (!ticket?.photo) return null;
  const token = await pb.files.getToken();
  return pb.files.getURL(ticket, ticket.photo, { thumb, token });
}
