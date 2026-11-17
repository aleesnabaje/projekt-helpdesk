"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, AlertCircle, ArrowDown, ArrowUp, BadgeHelp, BarChart3, Bell, Check, ChevronRight, CircleHelp, Computer, ImagePlus, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Sun, TicketCheck, UserRound, Wrench, X } from "lucide-react";
import { Button as Przycisk } from "@/components/ui/button";
import { Field as PoleFormularza, Input as PoleTekstowe, Select as ListaWyboru, Textarea as PoleOpisu } from "@/components/ui/field";
import { categories as kategorie, createTicket as dodajZgloszenie, currentUser as aktualnyUzytkownik, getEvents as pobierzHistorie, listTickets as pobierzZgloszenia, priorities as priorytety, rooms as sale, signOut as wyloguj, statuses as statusy, subscribeTickets as obserwujZgloszenia, ticketImageUrl as pobierzAdresZdjecia, updateTicket as zmienStatusZgloszenia } from "@/lib/api";
import { statusSchema as schematZmianyStatusu, ticketSchema as schematZgloszenia } from "@/lib/schemas";
const styleStatusu = {
  "Nowe": "status-new",
  "W realizacji": "status-progress",
  "Zamknięte": "status-done"
};
const categoryIcon = {
  "Sprzęt komputerowy": Computer,
  "Multimedia": CircleHelp,
  "Instalacje": Wrench,
  "Inne": BadgeHelp
};
const formatDaty = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
function czytelnyBlad(blad) {
  if (blad?.stage === "history") return blad.message;
  if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) return "Dodaj adres PocketBase do zmiennej NEXT_PUBLIC_POCKETBASE_URL.";
  if (!blad?.status) return "Brak połączenia z PocketBase. Sprawdź adres i dostępność usługi.";
  if (blad.status === 404) return "PocketBase odrzucił odczyt lub zmianę zgłoszenia. Sprawdź reguły View i Update kolekcji problemy oraz czy konto ma rola = technik.";
  const dane = blad?.data?.data || {};
  const pierwszy = Object.values(dane)[0];
  return pierwszy?.message || blad?.data?.message || "Nie udało się wykonać operacji. Sprawdź wymagane pola.";
}
function ZnacznikStatusu({
  value: wartosc
}) {
  return <span className={`status-pill ${styleStatusu[wartosc] || "status-new"}`}><i />{wartosc}</span>;
}
function EtykietaPriorytetu({
  value: wartosc
}) {
  return <span className={`priority priority-${(wartosc || "niski").toLowerCase()}`}>{wartosc === "Wysoki" ? <ArrowUp size={13} /> : wartosc === "Niski" ? <ArrowDown size={13} /> : <Activity size={13} />}{wartosc}</span>;
}
function OknoNowegoZgloszenia({
  onClose,
  onCreated
}) {
  const [bladSerwera, ustawBladSerwera] = useState("");
  const [wysylanie, ustawWysylanie] = useState(false);
  const formularz = useForm({
    resolver: zodResolver(schematZgloszenia),
    defaultValues: {
      title: "",
      description: "",
      room: "",
      category: "",
      priority: "Średni"
    }
  });
  async function wyslijFormularz(dane) {
    ustawBladSerwera("");
    ustawWysylanie(true);
    try {
      const daneZgloszenia = {
        ...dane
      };
      const files = daneZgloszenia.photo;
      delete daneZgloszenia.photo;
      if (files?.length) daneZgloszenia.photo = files[0];
      await dodajZgloszenie(daneZgloszenia);
      onCreated();
    } catch (blad) {
      ustawBladSerwera(czytelnyBlad(blad));
    } finally {
      ustawWysylanie(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget) onClose();
  }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="ticket-form-title">
      <div className="modal-head"><div><span className="eyebrow">NOWE ZGŁOSZENIE</span><h2 id="ticket-form-title">Co się zepsuło?</h2><p>Opisz problem, a my zajmiemy się resztą.</p></div><Przycisk variant="ghost" size="icon" aria-label="Zamknij" onClick={onClose}><X size={19} /></Przycisk></div>
      <form className="form-stack ticket-form" onSubmit={formularz.handleSubmit(wyslijFormularz)} noValidate>
        <PoleFormularza label="Tytuł zgłoszenia" error={formularz.formState.errors.title?.message}><PoleTekstowe placeholder="Np. Komputer nie uruchamia się" maxLength={100} {...formularz.register("title")} /></PoleFormularza>
        <PoleFormularza label="Opis usterki" error={formularz.formState.errors.description?.message}><PoleOpisu placeholder="Napisz, co się dzieje i od kiedy…" maxLength={2000} {...formularz.register("description")} /></PoleFormularza>
        <div className="form-row form-row-three">
          <PoleFormularza label="Sala" error={formularz.formState.errors.room?.message}><ListaWyboru {...formularz.register("room")}><option value="">Wybierz salę</option>{sale.map(sala => <option key={sala}>{sala}</option>)}</ListaWyboru></PoleFormularza>
          <PoleFormularza label="Kategoria" error={formularz.formState.errors.category?.message}><ListaWyboru {...formularz.register("category")}><option value="">Wybierz</option>{kategorie.map(kategoria => <option key={kategoria}>{kategoria}</option>)}</ListaWyboru></PoleFormularza>
          <PoleFormularza label="Priorytet" error={formularz.formState.errors.priority?.message}><ListaWyboru {...formularz.register("priority")}>{priorytety.map(priorytet => <option key={priorytet}>{priorytet}</option>)}</ListaWyboru></PoleFormularza>
        </div>
        <PoleFormularza label="Zdjęcie usterki" error={formularz.formState.errors.photo?.message} hint="JPG, PNG lub inny obraz · maks. 5 MB">
          <div className="upload-control"><ImagePlus size={18} /><span>Dodaj zdjęcie</span><PoleTekstowe type="file" accept="image/jpeg,image/png,image/webp,image/gif" {...formularz.register("photo")} /></div>
        </PoleFormularza>
        {bladSerwera && <p className="form-alert" role="alert">{bladSerwera}</p>}
        <div className="modal-actions"><Przycisk type="button" variant="secondary" onClick={onClose}>Anuluj</Przycisk><Przycisk type="submit" disabled={wysylanie}>{wysylanie ? "Wysyłanie…" : "Wyślij zgłoszenie"}<ArrowUp size={16} /></Przycisk></div>
      </form>
    </section>
  </div>;
}
function SzczegolyZgloszenia({
  ticket: zgloszenie,
  isTechnician,
  onClose,
  onUpdated
}) {
  const [historia, ustawHistorie] = useState([]);
  const [zdjecie, ustawZdjecie] = useState(null);
  const [ladowanieHistorii, setLoadingEvents] = useState(true);
  const [bladSerwera, ustawBladSerwera] = useState("");
  const [zapisywanie, setSaving] = useState(false);
  const formularz = useForm({
    resolver: zodResolver(schematZmianyStatusu),
    defaultValues: {
      status: zgloszenie.status,
      comment: ""
    }
  });
  useEffect(() => {
    let aktywny = true;
    pobierzHistorie(zgloszenie.id).then(dane => {
      if (aktywny) ustawHistorie(dane);
    }).catch(() => {}).finally(() => {
      if (aktywny) setLoadingEvents(false);
    });
    return () => {
      aktywny = false;
    };
  }, [zgloszenie.id]);
  useEffect(() => {
    let aktywny = true;
    if (!zgloszenie.photo) {
      ustawZdjecie(null);
      return () => {
        aktywny = false;
      };
    }
    pobierzAdresZdjecia(zgloszenie).then(adres => {
      if (aktywny) ustawZdjecie(adres);
    }).catch(() => {
      if (aktywny) ustawZdjecie(null);
    });
    return () => {
      aktywny = false;
    };
  }, [zgloszenie.id, zgloszenie.photo]);
  async function wyslijFormularz(dane) {
    setSaving(true);
    ustawBladSerwera("");
    try {
      await zmienStatusZgloszenia(zgloszenie.id, {
        ...dane,
        fromStatus: zgloszenie.status
      });
      await onUpdated();
    } catch (blad) {
      ustawBladSerwera(czytelnyBlad(blad));
    } finally {
      setSaving(false);
    }
  }
  return <div className="modal-backdrop" onMouseDown={e => {
    if (e.target === e.currentTarget) onClose();
  }}>
    <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title">
      <div className="modal-head"><div><span className="eyebrow">ZGŁOSZENIE · {zgloszenie.id.slice(0, 8).toUpperCase()}</span><h2 id="ticket-detail-title">{zgloszenie.title}</h2><p>{zgloszenie.room} <span className="dot-sep">·</span> {zgloszenie.category} <span className="dot-sep">·</span> {formatDaty.format(new Date(zgloszenie.created))}</p></div><Przycisk variant="ghost" size="icon" aria-label="Zamknij" onClick={onClose}><X size={19} /></Przycisk></div>
      <div className="detail-grid"><div className="detail-main">
        <div className="detail-summary"><div className="detail-meta"><ZnacznikStatusu value={zgloszenie.status} /><EtykietaPriorytetu value={zgloszenie.priority} /></div><p>{zgloszenie.description}</p></div>
        {zdjecie && <a href={zdjecie} target="_blank" rel="noreferrer" className="ticket-photo-link"><img src={zdjecie} alt="Zdjęcie zgłoszonej usterki" /></a>}
        <div className="history-block"><h3><Activity size={16} /> Historia zgłoszenia</h3>{ladowanieHistorii ? <p className="muted-text">Ładowanie historii…</p> : historia.length ? <ol className="event-list">{historia.map(wpis => <li key={wpis.id}><span className="event-dot" /><div><strong>{wpis.expand?.actor?.name || "Technik"}</strong><span>{wpis.from_status ? ` zmienił status: ${wpis.from_status} → ${wpis.to_status}` : ` ustawił status: ${wpis.to_status}`}</span><time>{formatDaty.format(new Date(wpis.created))}</time>{wpis.comment && <p className="event-comment">{wpis.comment}</p>}</div></li>)}</ol> : <p className="muted-text">Na razie brak zmian w tym zgłoszeniu.</p>}</div>
      </div><aside className="detail-side"><div className="detail-side-card"><span className="side-label">PRIORYTET</span><EtykietaPriorytetu value={zgloszenie.priority} /><span className="side-label">SALA</span><strong>{zgloszenie.room}</strong><span className="side-label">ZGŁOSIŁ</span><strong>{zgloszenie.expand?.owner?.name || "Uczeń"}</strong></div>
        {isTechnician && <form className="tech-update" onSubmit={formularz.handleSubmit(wyslijFormularz)}><h3>Aktualizacja</h3><PoleFormularza label="Zmień status" error={formularz.formState.errors.status?.message}><ListaWyboru {...formularz.register("status")}>{statusy.map(status => <option key={status}>{status}</option>)}</ListaWyboru></PoleFormularza><PoleFormularza label="Komentarz dla zgłaszającego" error={formularz.formState.errors.comment?.message}><PoleOpisu placeholder="Dodaj informację o postępie…" maxLength={1000} {...formularz.register("comment")} /></PoleFormularza>{bladSerwera && <p className="form-alert" role="alert">{bladSerwera}</p>}<Przycisk type="submit" disabled={zapisywanie} className="w-full">{zapisywanie ? "Zapisywanie…" : "Zapisz aktualizację"}<Check size={16} /></Przycisk></form>}
      </aside></div>
    </section>
  </div>;
}
function PrzelacznikMotywu({
  theme: motyw,
  onToggle
}) {
  return <Przycisk variant="ghost" size="icon" aria-label={motyw === "light" ? "Włącz tryb ciemny" : "Włącz tryb jasny"} onClick={onToggle}>{motyw === "light" ? <Moon size={18} /> : <Sun size={18} />}</Przycisk>;
}
function StronaGlowna() {
  const nawigacja = useRouter();
  const [uzytkownik, ustawUzytkownika] = useState(null);
  const [zgloszenia, ustawZgloszenia] = useState([]);
  const [ladowanie, ustawLadowanie] = useState(true);
  const [bladPobierania, ustawBladPobierania] = useState("");
  const [oknoTworzenia, ustawOknoTworzenia] = useState(false);
  const [wybraneZgloszenie, ustawWybraneZgloszenie] = useState(null);
  const [filtry, ustawFiltry] = useState({
    status: "",
    room: "",
    priority: ""
  });
  const [szukanaFraza, ustawSzukanaFraze] = useState("");
  const [motyw, ustawMotyw] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const isTechnician = uzytkownik?.role === "technik";
  const odswiezZgloszenia = useCallback(async (zalogowanyUzytkownik = uzytkownik) => {
    if (!zalogowanyUzytkownik) return;
    try {
      ustawBladPobierania("");
      ustawZgloszenia(await pobierzZgloszenia(zalogowanyUzytkownik));
    } catch (blad) {
      ustawBladPobierania(czytelnyBlad(blad));
    } finally {
      ustawLadowanie(false);
    }
  }, [uzytkownik]);
  useEffect(() => {
    const zalogowanyUzytkownik = aktualnyUzytkownik();
    if (!zalogowanyUzytkownik) {
      nawigacja.replace("/login");
      return;
    }
    ustawUzytkownika(zalogowanyUzytkownik);
    const zapisanyMotyw = window.localStorage.getItem("helpdesk-theme") || "light";
    ustawMotyw(zapisanyMotyw);
    document.documentElement.dataset.theme = zapisanyMotyw;
  }, [nawigacja]);
  useEffect(() => {
    if (!uzytkownik) return;
    ustawLadowanie(true);
    odswiezZgloszenia(uzytkownik);
  }, [uzytkownik, odswiezZgloszenia]);
  useEffect(() => {
    if (!uzytkownik || !isTechnician) return;
    const odsubskrybuj = obserwujZgloszenia(() => odswiezZgloszenia(uzytkownik)).catch(blad => console.warn("PocketBase realtime unavailable", blad));
    return () => {
      Promise.resolve(odsubskrybuj).then(fn => fn?.()).catch(() => {});
    };
  }, [uzytkownik, isTechnician, odswiezZgloszenia]);
  const przefiltrowaneZgloszenia = useMemo(() => {
    const fraza = szukanaFraza.trim().toLocaleLowerCase("pl-PL");
    return zgloszenia.filter(zgloszenie => {
      const pasujeDoFiltrow = !isTechnician || (!filtry.status || zgloszenie.status === filtry.status) && (!filtry.room || zgloszenie.room === filtry.room) && (!filtry.priority || zgloszenie.priority === filtry.priority);
      const pasujeDoSzukania = !fraza || `${zgloszenie.title} ${zgloszenie.room} ${zgloszenie.category} ${zgloszenie.expand?.owner?.name || ""}`.toLocaleLowerCase("pl-PL").includes(fraza);
      return pasujeDoFiltrow && pasujeDoSzukania;
    });
  }, [zgloszenia, szukanaFraza, filtry, isTechnician]);
  const liczbaOtwartych = zgloszenia.filter(zgloszenie => zgloszenie.status !== "Zamknięte").length;
  const liczbaNowych = zgloszenia.filter(zgloszenie => zgloszenie.status === "Nowe").length;
  const liczbaWedlugKategorii = kategorie.map(kategoria => ({
    category: kategoria,
    count: zgloszenia.filter(zgloszenie => zgloszenie.category === kategoria).length
  })).sort((a, b) => b.count - a.count);
  const liczbaWedlugSali = Object.entries(zgloszenia.reduce((liczniki, zgloszenie) => ({
    ...liczniki,
    [zgloszenie.room]: (liczniki[zgloszenie.room] || 0) + 1
  }), {})).sort((a, b) => b[1] - a[1]);
  function przelaczMotyw() {
    const nastepny = motyw === "light" ? "dark" : "light";
    ustawMotyw(nastepny);
    document.documentElement.dataset.theme = nastepny;
    window.localStorage.setItem("helpdesk-theme", nastepny);
  }
  function wylogujZKonta() {
    wyloguj();
    nawigacja.replace("/login");
  }
  async function zamknijPoUtworzeniu() {
    ustawOknoTworzenia(false);
    await odswiezZgloszenia(uzytkownik);
  }
  async function odswiezPoAktualizacji() {
    await odswiezZgloszenia(uzytkownik);
    ustawWybraneZgloszenie(null);
  }
  if (!uzytkownik) return <div className="loading-screen"><div className="loading-mark"><BadgeHelp size={20} /></div><span>Przygotowujemy helpdesk…</span></div>;
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="/"><span className="brand-mark"><BadgeHelp size={20} /></span><span>szkolny<strong>helpdesk</strong></span></a>

      <div className="nav-caption">MENU GŁÓWNE</div>
      <nav className="side-nav"><a href="#tickets" className="nav-link nav-active"><LayoutDashboard size={18} /><span>{isTechnician ? "Panel technika" : "Moje zgłoszenia"}</span></a>{isTechnician && <a href="#summary" className="nav-link"><BarChart3 size={18} /><span>Statystyki</span></a>}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={18} /></span><strong>Potrzebujesz pomocy?</strong><p>Opisz problem w zgłoszeniu, a nasz technik wróci do Ciebie.</p><button onClick={() => ustawOknoTworzenia(true)}>Utwórz zgłoszenie <ChevronRight size={15} /></button></div><button className="profile-button" onClick={wylogujZKonta}><span className="profile-avatar">{(uzytkownik.name || uzytkownik.email || "U").slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{uzytkownik.name || uzytkownik.email}</strong><small>{isTechnician ? "Technik" : "Użytkownik"}</small></span><LogOut size={17} /></button></div>
    </aside>
    {menuOpen && <button className="mobile-scrim" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}
    <main className="main-area" id="tickets">
      <header className="topbar"><div className="topbar-left"><Przycisk variant="ghost" size="icon" className="mobile-menu" aria-label="Otwórz menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></Przycisk><div className="breadcrumb">Panel <ChevronRight size={14} /> <strong>{isTechnician ? "Zgłoszenia" : "Moje zgłoszenia"}</strong></div></div><div className="topbar-actions"><span className="today-label">Szkolny system zgłoszeń</span><PrzelacznikMotywu theme={motyw} onToggle={przelaczMotyw} /><span className="topbar-avatar">{(uzytkownik.name || uzytkownik.email || "U").slice(0, 1).toUpperCase()}</span></div></header>
      <div className="page-content">
        <section className="page-heading"><div><span className="eyebrow">{isTechnician ? "CENTRUM ZARZĄDZANIA" : "WITAJ W SZKOLNYM HELPDESKU"}</span><h1>{isTechnician ? "Dzień dobry" : "Twoje zgłoszenia"}<span className="heading-period">.</span></h1><p>{isTechnician ? "Przeglądaj problemy i pomagaj utrzymać szkołę w ruchu." : "Zgłaszaj usterki i sprawdzaj, na jakim etapie jest ich naprawa."}</p></div><Przycisk onClick={() => ustawOknoTworzenia(true)}><Plus size={18} /> Nowe zgłoszenie</Przycisk></section>
        {isTechnician && <><section className="metric-grid" id="summary"><article className="metric-card metric-primary"><span className="metric-icon"><TicketCheck size={19} /></span><span className="metric-label">OTWARTE ZGŁOSZENIA</span><strong>{liczbaOtwartych}</strong><small>{liczbaNowych} nowych do sprawdzenia</small><span className="metric-decoration">{liczbaOtwartych}</span></article><article className="metric-card"><span className="metric-icon metric-icon-violet"><BarChart3 size={19} /></span><span className="metric-label">NAJCZĘSTSZA KATEGORIA</span><strong className="metric-category">{liczbaWedlugKategorii[0]?.count ? liczbaWedlugKategorii[0].category : "—"}</strong><small>{liczbaWedlugKategorii[0]?.count || 0} zgłoszeń w tej kategorii</small></article><article className="metric-card"><span className="metric-icon metric-icon-orange"><Wrench size={19} /></span><span className="metric-label">SALA Z NAJWIĘKSZĄ LICZBĄ</span><strong>{liczbaWedlugSali[0]?.[0] || "—"}</strong><small>{liczbaWedlugSali[0]?.[1] || 0} zgłoszeń do naprawy</small></article></section><section className="category-breakdown"><div className="category-breakdown-head"><div><h2>Zgłoszenia według kategorii</h2><p>Rozkład wszystkich zgłoszeń w szkole</p></div><BarChart3 size={18} /></div><div className="category-bars">{liczbaWedlugKategorii.map(({
                category: kategoria,
                count: liczba
              }) => <div className="category-bar-row" key={kategoria}><span>{kategoria}</span><div className="category-track"><i style={{
                    width: `${zgloszenia.length ? Math.max(liczba / zgloszenia.length * 100, liczba ? 8 : 0) : 0}%`
                  }} /></div><strong>{liczba}</strong></div>)}</div></section></>}
        {!isTechnician && <section className="welcome-banner"><div className="welcome-art"><span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✦</span><div className="art-card"><Wrench size={27} /></div></div><div><span className="banner-kicker">COŚ NIE DZIAŁA?</span><h2>Razem szybko to naprawimy.</h2><p>Opisz problem, wskaż salę i śledź postępy w jednym miejscu.</p></div><Przycisk variant="secondary" onClick={() => ustawOknoTworzenia(true)}>Zgłoś usterkę <ChevronRight size={16} /></Przycisk></section>}
        <section className="ticket-section">
          <div className="section-heading"><div><h2>{isTechnician ? "Wszystkie zgłoszenia" : "Ostatnie zgłoszenia"}</h2><p>{isTechnician ? "Przeglądaj i aktualizuj zgłoszenia ze szkoły." : "Tutaj znajdziesz status swoich zgłoszeń."}</p></div><span className="ticket-count">{przefiltrowaneZgloszenia.length} {przefiltrowaneZgloszenia.length === 1 ? "zgłoszenie" : "zgłoszeń"}</span></div>
          <div className="filter-bar"><div className="search-box"><Search size={17} /><PoleTekstowe aria-label="Szukaj zgłoszeń" placeholder="Szukaj zgłoszenia…" value={szukanaFraza} onChange={e => ustawSzukanaFraze(e.target.value)} /></div>{isTechnician && <div className="filter-selects"><ListaWyboru aria-label="Filtruj po statusie" value={filtry.status} onChange={e => ustawFiltry({
                ...filtry,
                status: e.target.value
              })}><option value="">Wszystkie statusy</option>{statusy.map(status => <option key={status}>{status}</option>)}</ListaWyboru><ListaWyboru aria-label="Filtruj po sali" value={filtry.room} onChange={e => ustawFiltry({
                ...filtry,
                room: e.target.value
              })}><option value="">Wszystkie sale</option>{sale.map(sala => <option key={sala}>{sala}</option>)}</ListaWyboru><ListaWyboru aria-label="Filtruj po priorytecie" value={filtry.priority} onChange={e => ustawFiltry({
                ...filtry,
                priority: e.target.value
              })}><option value="">Każdy priorytet</option>{priorytety.map(priorytet => <option key={priorytet}>{priorytet}</option>)}</ListaWyboru></div>}</div>
          {bladPobierania && <div className="load-alert"><AlertCircle size={17} /><span>{bladPobierania}</span><Przycisk variant="secondary" size="sm" onClick={() => odswiezZgloszenia(uzytkownik)}>Spróbuj ponownie</Przycisk></div>}
          <div className="ticket-table-wrap"><table className="ticket-table"><thead><tr><th>ZGŁOSZENIE</th>{isTechnician && <th>ZGŁASZAJĄCY</th>}<th>SALA</th><th>PRIORYTET</th><th>STATUS</th><th>DATA</th><th aria-label="Szczegóły" /></tr></thead><tbody>
            {ladowanie ? <tr><td colSpan={isTechnician ? 7 : 6} className="table-message">Ładowanie zgłoszeń…</td></tr> : przefiltrowaneZgloszenia.length ? przefiltrowaneZgloszenia.map(zgloszenie => {
                  const Icon = categoryIcon[zgloszenie.category] || BadgeHelp;
                  return <tr key={zgloszenie.id} className="ticket-row" onClick={() => ustawWybraneZgloszenie(zgloszenie)} tabIndex={0} onKeyDown={e => {
                    if (e.key === "Enter") ustawWybraneZgloszenie(zgloszenie);
                  }}><td><div className="ticket-name"><span className="category-icon"><Icon size={17} /></span><span><strong>{zgloszenie.title}</strong><small>{zgloszenie.category}</small></span></div></td>{isTechnician && <td><span className="requester"><span className="requester-avatar">{(zgloszenie.expand?.owner?.name || "U").slice(0, 1).toUpperCase()}</span>{zgloszenie.expand?.owner?.name || "Użytkownik"}</span></td>}<td>{zgloszenie.room}</td><td><EtykietaPriorytetu value={zgloszenie.priority} /></td><td><ZnacznikStatusu value={zgloszenie.status} /></td><td className="date-cell">{formatDaty.format(new Date(zgloszenie.created))}</td><td><ChevronRight className="row-chevron" size={17} /></td></tr>;
                }) : <tr><td colSpan={isTechnician ? 7 : 6} className="table-message"><div className="empty-state"><span className="empty-icon"><TicketCheck size={23} /></span><strong>{szukanaFraza || Object.values(filtry).some(Boolean) ? "Brak pasujących zgłoszeń" : isTechnician ? "Nie ma jeszcze zgłoszeń" : "Nie masz jeszcze zgłoszeń"}</strong><span>{szukanaFraza || Object.values(filtry).some(Boolean) ? "Zmień filtry lub wyszukiwaną frazę." : "Gdy tylko pojawi się problem, możesz zgłosić go tutaj."}</span>{!isTechnician && !szukanaFraza && <Przycisk variant="secondary" size="sm" onClick={() => ustawOknoTworzenia(true)}><Plus size={15} /> Dodaj pierwsze zgłoszenie</Przycisk>}</div></td></tr>}
          </tbody></table></div>
          {isTechnician && <div className="realtime-note"><span className="live-dot" /> Lista aktualizuje się automatycznie <span className="realtime-divider">·</span> PocketBase realtime</div>}
        </section>
        <footer className="app-footer"><span>© 2026 Szkolny Helpdesk</span><span><Bell size={14} /> Zgłoszenia monitoruje szkolny technik</span></footer>
      </div>
    </main>
    {oknoTworzenia && <OknoNowegoZgloszenia onClose={() => ustawOknoTworzenia(false)} onCreated={zamknijPoUtworzeniu} />}
    {wybraneZgloszenie && <SzczegolyZgloszenia ticket={wybraneZgloszenie} isTechnician={isTechnician} onClose={() => ustawWybraneZgloszenie(null)} onUpdated={odswiezPoAktualizacji} />}
  </div>;
}
export { StronaGlowna as default };
