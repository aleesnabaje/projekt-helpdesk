"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertCircle, ArrowDown, ArrowUp, BadgeHelp, BarChart3, Bell, Check, ChevronDown, ChevronRight, CircleHelp, Computer, ImagePlus, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Sun, TicketCheck, UserRound, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { categories, createTicket, currentUser, getEvents, listTickets, priorities, rooms, signOut, statuses, subscribeTickets, ticketImageUrl, updateTicket } from "@/lib/api";
import { statusSchema, ticketSchema } from "@/lib/schemas";

const statusStyle = { "Nowe": "status-new", "W realizacji": "status-progress", "Zamknięte": "status-done" };
const categoryIcon = { "Sprzęt komputerowy": Computer, "Multimedia": CircleHelp, "Instalacje": Wrench, "Inne": BadgeHelp };
const dateFormat = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", year: "numeric" });

function readableError(error) {
  if (error?.stage === "history") return error.message;
  if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) return "Dodaj adres PocketBase do zmiennej NEXT_PUBLIC_POCKETBASE_URL.";
  if (!error?.status) return "Brak połączenia z PocketBase. Sprawdź adres i dostępność usługi.";
  if (error.status === 404) return "PocketBase odrzucił odczyt lub zmianę zgłoszenia. Sprawdź reguły View i Update kolekcji problemy oraz czy konto ma rola = technik.";
  const data = error?.data?.data || {};
  const first = Object.values(data)[0];
  return first?.message || error?.data?.message || "Nie udało się wykonać operacji. Sprawdź wymagane pola.";
}

function StatusPill({ value }) {
  return <span className={`status-pill ${statusStyle[value] || "status-new"}`}><i />{value}</span>;
}

function PriorityLabel({ value }) {
  return <span className={`priority priority-${(value || "niski").toLowerCase()}`}>{value === "Wysoki" ? <ArrowUp size={13} /> : value === "Niski" ? <ArrowDown size={13} /> : <Activity size={13} />}{value}</span>;
}

function TicketModal({ onClose, onCreated }) {
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "", room: "", category: "", priority: "Średni" },
  });
  async function submit(values) {
    setServerError(""); setSubmitting(true);
    try {
      const data = { ...values };
      const files = data.photo;
      delete data.photo;
      if (files?.length) data.photo = files[0];
      await createTicket(data);
      onCreated();
    } catch (error) { setServerError(readableError(error)); }
    finally { setSubmitting(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="ticket-form-title">
      <div className="modal-head"><div><span className="eyebrow">NOWE ZGŁOSZENIE</span><h2 id="ticket-form-title">Co się zepsuło?</h2><p>Opisz problem, a my zajmiemy się resztą.</p></div><Button variant="ghost" size="icon" aria-label="Zamknij" onClick={onClose}><X size={19} /></Button></div>
      <form className="form-stack ticket-form" onSubmit={form.handleSubmit(submit)} noValidate>
        <Field label="Tytuł zgłoszenia" error={form.formState.errors.title?.message}><Input placeholder="Np. Komputer nie uruchamia się" maxLength={100} {...form.register("title")} /></Field>
        <Field label="Opis usterki" error={form.formState.errors.description?.message}><Textarea placeholder="Napisz, co się dzieje i od kiedy…" maxLength={2000} {...form.register("description")} /></Field>
        <div className="form-row form-row-three">
          <Field label="Sala" error={form.formState.errors.room?.message}><Select {...form.register("room")}><option value="">Wybierz salę</option>{rooms.map((room) => <option key={room}>{room}</option>)}</Select></Field>
          <Field label="Kategoria" error={form.formState.errors.category?.message}><Select {...form.register("category")}><option value="">Wybierz</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field>
          <Field label="Priorytet" error={form.formState.errors.priority?.message}><Select {...form.register("priority")}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></Field>
        </div>
        <Field label="Zdjęcie usterki" error={form.formState.errors.photo?.message} hint="JPG, PNG lub inny obraz · maks. 5 MB">
          <div className="upload-control"><ImagePlus size={18} /><span>Dodaj zdjęcie</span><Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" {...form.register("photo")} /></div>
        </Field>
        {serverError && <p className="form-alert" role="alert">{serverError}</p>}
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Anuluj</Button><Button type="submit" disabled={submitting}>{submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}<ArrowUp size={16} /></Button></div>
      </form>
    </section>
  </div>;
}

function TicketDetail({ ticket, isTechnician, onClose, onUpdated }) {
  const [events, setEvents] = useState([]);
  const [image, setImage] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const form = useForm({ resolver: zodResolver(statusSchema), defaultValues: { status: ticket.status, comment: "" } });
  useEffect(() => {
    let active = true;
    getEvents(ticket.id).then((data) => { if (active) setEvents(data); }).catch(() => {}).finally(() => { if (active) setLoadingEvents(false); });
    return () => { active = false; };
  }, [ticket.id]);
  useEffect(() => {
    let active = true;
    if (!ticket.photo) { setImage(null); return () => { active = false; }; }
    ticketImageUrl(ticket).then((url) => { if (active) setImage(url); }).catch(() => { if (active) setImage(null); });
    return () => { active = false; };
  }, [ticket.id, ticket.photo]);
  async function submit(values) {
    setSaving(true); setServerError("");
    try { await updateTicket(ticket.id, { ...values, fromStatus: ticket.status }); await onUpdated(); }
    catch (error) { setServerError(readableError(error)); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title">
      <div className="modal-head"><div><span className="eyebrow">ZGŁOSZENIE · {ticket.id.slice(0, 8).toUpperCase()}</span><h2 id="ticket-detail-title">{ticket.title}</h2><p>{ticket.room} <span className="dot-sep">·</span> {ticket.category} <span className="dot-sep">·</span> {dateFormat.format(new Date(ticket.created))}</p></div><Button variant="ghost" size="icon" aria-label="Zamknij" onClick={onClose}><X size={19} /></Button></div>
      <div className="detail-grid"><div className="detail-main">
        <div className="detail-summary"><div className="detail-meta"><StatusPill value={ticket.status} /><PriorityLabel value={ticket.priority} /></div><p>{ticket.description}</p></div>
        {image && <a href={image} target="_blank" rel="noreferrer" className="ticket-photo-link"><img src={image} alt="Zdjęcie zgłoszonej usterki" /></a>}
        <div className="history-block"><h3><Activity size={16} /> Historia zgłoszenia</h3>{loadingEvents ? <p className="muted-text">Ładowanie historii…</p> : events.length ? <ol className="event-list">{events.map((event) => <li key={event.id}><span className="event-dot" /><div><strong>{event.expand?.actor?.name || "Technik"}</strong><span>{event.from_status ? ` zmienił status: ${event.from_status} → ${event.to_status}` : ` ustawił status: ${event.to_status}`}</span><time>{dateFormat.format(new Date(event.created))}</time>{event.comment && <p className="event-comment">{event.comment}</p>}</div></li>)}</ol> : <p className="muted-text">Na razie brak zmian w tym zgłoszeniu.</p>}</div>
      </div><aside className="detail-side"><div className="detail-side-card"><span className="side-label">PRIORYTET</span><PriorityLabel value={ticket.priority} /><span className="side-label">SALA</span><strong>{ticket.room}</strong><span className="side-label">ZGŁOSIŁ</span><strong>{ticket.expand?.owner?.name || "Uczeń"}</strong></div>
        {isTechnician && <form className="tech-update" onSubmit={form.handleSubmit(submit)}><h3>Aktualizacja</h3><Field label="Zmień status" error={form.formState.errors.status?.message}><Select {...form.register("status")}>{statuses.map((status) => <option key={status}>{status}</option>)}</Select></Field><Field label="Komentarz dla zgłaszającego" error={form.formState.errors.comment?.message}><Textarea placeholder="Dodaj informację o postępie…" maxLength={1000} {...form.register("comment")} /></Field>{serverError && <p className="form-alert" role="alert">{serverError}</p>}<Button type="submit" disabled={saving} className="w-full">{saving ? "Zapisywanie…" : "Zapisz aktualizację"}<Check size={16} /></Button></form>}
      </aside></div>
    </section>
  </div>;
}

function ThemeToggle({ theme, onToggle }) {
  return <Button variant="ghost" size="icon" aria-label={theme === "light" ? "Włącz tryb ciemny" : "Włącz tryb jasny"} onClick={onToggle}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</Button>;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({ status: "", room: "", priority: "" });
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const isTechnician = user?.role === "technik";

  const refreshTickets = useCallback(async (current = user) => {
    if (!current) return;
    try { setLoadError(""); setTickets(await listTickets(current)); }
    catch (error) { setLoadError(readableError(error)); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    const activeUser = currentUser();
    if (!activeUser) { router.replace("/login"); return; }
    setUser(activeUser);
    const savedTheme = window.localStorage.getItem("helpdesk-theme") || "light";
    setTheme(savedTheme); document.documentElement.dataset.theme = savedTheme;
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refreshTickets(user);
  }, [user, refreshTickets]);

  useEffect(() => {
    if (!user || !isTechnician) return;
    const unsubscribe = subscribeTickets(() => refreshTickets(user)).catch((error) => console.warn("PocketBase realtime unavailable", error));
    return () => { Promise.resolve(unsubscribe).then((fn) => fn?.()).catch(() => {}); };
  }, [user, isTechnician, refreshTickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pl-PL");
    return tickets.filter((ticket) => {
      const matchesFilters = !isTechnician || ((!filters.status || ticket.status === filters.status) && (!filters.room || ticket.room === filters.room) && (!filters.priority || ticket.priority === filters.priority));
      const matchesSearch = !query || `${ticket.title} ${ticket.room} ${ticket.category} ${ticket.expand?.owner?.name || ""}`.toLocaleLowerCase("pl-PL").includes(query);
      return matchesFilters && matchesSearch;
    });
  }, [tickets, search, filters, isTechnician]);
  const openCount = tickets.filter((ticket) => ticket.status !== "Zamknięte").length;
  const newCount = tickets.filter((ticket) => ticket.status === "Nowe").length;
  const categoryCounts = categories.map((category) => ({ category, count: tickets.filter((ticket) => ticket.category === category).length })).sort((a, b) => b.count - a.count);
  const roomCounts = Object.entries(tickets.reduce((counts, ticket) => ({ ...counts, [ticket.room]: (counts[ticket.room] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next); document.documentElement.dataset.theme = next; window.localStorage.setItem("helpdesk-theme", next);
  }
  function logout() { signOut(); router.replace("/login"); }
  async function closeCreated() { setCreateOpen(false); await refreshTickets(user); }
  async function refreshDetail() { await refreshTickets(user); setSelectedTicket(null); }

  if (!user) return <div className="loading-screen"><div className="loading-mark"><BadgeHelp size={20} /></div><span>Przygotowujemy helpdesk…</span></div>;

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="/"><span className="brand-mark"><BadgeHelp size={20} /></span><span>szkolny<strong>helpdesk</strong></span></a>
      <div className="school-switch"><span className="school-avatar">L</span><span><strong>Liceum Ogólnokształcące</strong><small>Panel {isTechnician ? "technika" : "ucznia"}</small></span><ChevronDown size={15} /></div>
      <div className="nav-caption">MENU GŁÓWNE</div>
      <nav className="side-nav"><a href="#tickets" className="nav-link nav-active"><LayoutDashboard size={18} /><span>{isTechnician ? "Panel technika" : "Moje zgłoszenia"}</span></a>{isTechnician && <a href="#summary" className="nav-link"><BarChart3 size={18} /><span>Statystyki</span></a>}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={18} /></span><strong>Potrzebujesz pomocy?</strong><p>Opisz problem w zgłoszeniu, a nasz technik wróci do Ciebie.</p><button onClick={() => setCreateOpen(true)}>Utwórz zgłoszenie <ChevronRight size={15} /></button></div><button className="profile-button" onClick={logout}><span className="profile-avatar">{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{user.name || user.email}</strong><small>{isTechnician ? "Technik" : "Użytkownik"}</small></span><LogOut size={17} /></button></div>
    </aside>
    {menuOpen && <button className="mobile-scrim" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}
    <main className="main-area" id="tickets">
      <header className="topbar"><div className="topbar-left"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Otwórz menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></Button><div className="breadcrumb">Panel <ChevronRight size={14} /> <strong>{isTechnician ? "Zgłoszenia" : "Moje zgłoszenia"}</strong></div></div><div className="topbar-actions"><span className="today-label">Szkolny system zgłoszeń</span><ThemeToggle theme={theme} onToggle={toggleTheme} /><span className="topbar-avatar">{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</span></div></header>
      <div className="page-content">
        <section className="page-heading"><div><span className="eyebrow">{isTechnician ? "CENTRUM ZARZĄDZANIA" : "WITAJ W SZKOLNYM HELPDESKU"}</span><h1>{isTechnician ? "Dzień dobry" : "Twoje zgłoszenia"}<span className="heading-period">.</span></h1><p>{isTechnician ? "Przeglądaj problemy i pomagaj utrzymać szkołę w ruchu." : "Zgłaszaj usterki i sprawdzaj, na jakim etapie jest ich naprawa."}</p></div><Button onClick={() => setCreateOpen(true)}><Plus size={18} /> Nowe zgłoszenie</Button></section>
        {isTechnician && <><section className="metric-grid" id="summary"><article className="metric-card metric-primary"><span className="metric-icon"><TicketCheck size={19} /></span><span className="metric-label">OTWARTE ZGŁOSZENIA</span><strong>{openCount}</strong><small>{newCount} nowych do sprawdzenia</small><span className="metric-decoration">{openCount}</span></article><article className="metric-card"><span className="metric-icon metric-icon-violet"><BarChart3 size={19} /></span><span className="metric-label">NAJCZĘSTSZA KATEGORIA</span><strong className="metric-category">{categoryCounts[0]?.count ? categoryCounts[0].category : "—"}</strong><small>{categoryCounts[0]?.count || 0} zgłoszeń w tej kategorii</small></article><article className="metric-card"><span className="metric-icon metric-icon-orange"><Wrench size={19} /></span><span className="metric-label">SALA Z NAJWIĘKSZĄ LICZBĄ</span><strong>{roomCounts[0]?.[0] || "—"}</strong><small>{roomCounts[0]?.[1] || 0} zgłoszeń do naprawy</small></article></section><section className="category-breakdown"><div className="category-breakdown-head"><div><h2>Zgłoszenia według kategorii</h2><p>Rozkład wszystkich zgłoszeń w szkole</p></div><BarChart3 size={18} /></div><div className="category-bars">{categoryCounts.map(({ category, count }) => <div className="category-bar-row" key={category}><span>{category}</span><div className="category-track"><i style={{ width: `${tickets.length ? Math.max((count / tickets.length) * 100, count ? 8 : 0) : 0}%` }} /></div><strong>{count}</strong></div>)}</div></section></>}
        {!isTechnician && <section className="welcome-banner"><div className="welcome-art"><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span><div className="art-card"><Wrench size={27} /></div></div><div><span className="banner-kicker">COŚ NIE DZIAŁA?</span><h2>Razem szybko to naprawimy.</h2><p>Opisz problem, wskaż salę i śledź postępy w jednym miejscu.</p></div><Button variant="secondary" onClick={() => setCreateOpen(true)}>Zgłoś usterkę <ChevronRight size={16} /></Button></section>}
        <section className="ticket-section">
          <div className="section-heading"><div><h2>{isTechnician ? "Wszystkie zgłoszenia" : "Ostatnie zgłoszenia"}</h2><p>{isTechnician ? "Przeglądaj i aktualizuj zgłoszenia ze szkoły." : "Tutaj znajdziesz status swoich zgłoszeń."}</p></div><span className="ticket-count">{filteredTickets.length} {filteredTickets.length === 1 ? "zgłoszenie" : "zgłoszeń"}</span></div>
          <div className="filter-bar"><div className="search-box"><Search size={17} /><Input aria-label="Szukaj zgłoszeń" placeholder="Szukaj zgłoszenia…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{isTechnician && <div className="filter-selects"><Select aria-label="Filtruj po statusie" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Wszystkie statusy</option>{statuses.map((status) => <option key={status}>{status}</option>)}</Select><Select aria-label="Filtruj po sali" value={filters.room} onChange={(e) => setFilters({ ...filters, room: e.target.value })}><option value="">Wszystkie sale</option>{rooms.map((room) => <option key={room}>{room}</option>)}</Select><Select aria-label="Filtruj po priorytecie" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">Każdy priorytet</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select></div>}</div>
          {loadError && <div className="load-alert"><AlertCircle size={17} /><span>{loadError}</span><Button variant="secondary" size="sm" onClick={() => refreshTickets(user)}>Spróbuj ponownie</Button></div>}
          <div className="ticket-table-wrap"><table className="ticket-table"><thead><tr><th>ZGŁOSZENIE</th>{isTechnician && <th>ZGŁASZAJĄCY</th>}<th>SALA</th><th>PRIORYTET</th><th>STATUS</th><th>DATA</th><th aria-label="Szczegóły" /></tr></thead><tbody>
            {loading ? <tr><td colSpan={isTechnician ? 7 : 6} className="table-message">Ładowanie zgłoszeń…</td></tr> : filteredTickets.length ? filteredTickets.map((ticket) => { const Icon = categoryIcon[ticket.category] || BadgeHelp; return <tr key={ticket.id} className="ticket-row" onClick={() => setSelectedTicket(ticket)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setSelectedTicket(ticket); }}><td><div className="ticket-name"><span className="category-icon"><Icon size={17} /></span><span><strong>{ticket.title}</strong><small>{ticket.category}</small></span></div></td>{isTechnician && <td><span className="requester"><span className="requester-avatar">{(ticket.expand?.owner?.name || "U").slice(0, 1).toUpperCase()}</span>{ticket.expand?.owner?.name || "Użytkownik"}</span></td>}<td>{ticket.room}</td><td><PriorityLabel value={ticket.priority} /></td><td><StatusPill value={ticket.status} /></td><td className="date-cell">{dateFormat.format(new Date(ticket.created))}</td><td><ChevronRight className="row-chevron" size={17} /></td></tr>; }) : <tr><td colSpan={isTechnician ? 7 : 6} className="table-message"><div className="empty-state"><span className="empty-icon"><TicketCheck size={23} /></span><strong>{search || Object.values(filters).some(Boolean) ? "Brak pasujących zgłoszeń" : isTechnician ? "Nie ma jeszcze zgłoszeń" : "Nie masz jeszcze zgłoszeń"}</strong><span>{search || Object.values(filters).some(Boolean) ? "Zmień filtry lub wyszukiwaną frazę." : "Gdy tylko pojawi się problem, możesz zgłosić go tutaj."}</span>{!isTechnician && !search && <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Dodaj pierwsze zgłoszenie</Button>}</div></td></tr>}
          </tbody></table></div>
          {isTechnician && <div className="realtime-note"><span className="live-dot" /> Lista aktualizuje się automatycznie <span className="realtime-divider">·</span> PocketBase realtime</div>}
        </section>
        <footer className="app-footer"><span>© 2026 Szkolny Helpdesk</span><span><Bell size={14} /> Zgłoszenia monitoruje szkolny technik</span></footer>
      </div>
    </main>
    {createOpen && <TicketModal onClose={() => setCreateOpen(false)} onCreated={closeCreated} />}
    {selectedTicket && <TicketDetail ticket={selectedTicket} isTechnician={isTechnician} onClose={() => setSelectedTicket(null)} onUpdated={refreshDetail} />}
  </div>;
}
