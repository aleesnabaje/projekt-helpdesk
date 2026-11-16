import { polaczKlasy } from "@/lib/utils";

export function PoleTekstowe({ className: klasa, ...pozostaleWlasciwosci }) {
  return <input className={polaczKlasy("field-control", klasa)} {...pozostaleWlasciwosci} />;
}

export function PoleOpisu({ className: klasa, ...pozostaleWlasciwosci }) {
  return <textarea className={polaczKlasy("field-control min-h-32 resize-y", klasa)} {...pozostaleWlasciwosci} />;
}

export function ListaWyboru({ className: klasa, children, ...pozostaleWlasciwosci }) {
  return <select className={polaczKlasy("field-control", klasa)} {...pozostaleWlasciwosci}>{children}</select>;
}

export function PoleFormularza({ etykieta, blad, podpowiedz, children, className: klasa }) {
  return <label className={polaczKlasy("field-wrap", klasa)}>
    <span className="field-label">{etykieta}</span>
    {children}
    {blad ? <span className="field-error">{blad}</span> : podpowiedz ? <span className="field-hint">{podpowiedz}</span> : null}
  </label>;
}

export const Input = PoleTekstowe;
export const Textarea = PoleOpisu;
export const Select = ListaWyboru;
export function Field({ label, error, hint, ...pozostaleWlasciwosci }) {
  return <PoleFormularza etykieta={label} blad={error} podpowiedz={hint} {...pozostaleWlasciwosci} />;
}
