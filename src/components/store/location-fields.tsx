"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type GeoOption = { code: string; name: string };

export type LocationValue = {
  country: string;
  countryCode?: string;
  state: string;
  stateCode?: string;
  city: string;
};

/** A dropdown with a search box, for long lists. `allowCustom` lets people use a value that is not listed. */
export function SearchSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  allowCustom = false,
  required = false,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  allowCustom?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = `${id}-list`;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Names that start with the search come first, then names that merely contain it.
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, query]);

  const typed = query.trim();
  const custom = allowCustom && typed.length > 1 && !options.some((o) => o.toLowerCase() === typed.toLowerCase()) ? typed : null;
  const shown = matches.slice(0, 1000);
  const total = shown.length + (custom ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    // Open the list at the current choice rather than at the top.
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(total - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active < shown.length) choose(shown[active]);
      else if (custom) choose(custom);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
          setActive(Math.max(options.indexOf(value), 0));
        }}
        className={cn("input flex items-center justify-between gap-2 text-left disabled:opacity-50", !value && "text-muted")}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronsUpDown size={15} strokeWidth={1.5} className="shrink-0 text-muted" />
      </button>
      {/* Lets the browser's own "please fill out this field" message work for this control. */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          onFocus={() => setOpen(true)}
          className="pointer-events-none absolute bottom-0 left-6 h-px w-px opacity-0"
        />
      )}

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 border border-line bg-bg shadow-xl shadow-black/10" style={{ borderRadius: "var(--radius)" }}>
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search size={15} strokeWidth={1.5} className="shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Type to search…"
              aria-label="Search"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted/70"
            />
          </div>
          <ul ref={list} id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {shown.map((option, i) => (
              <li key={option} role="option" aria-selected={option === value}>
                <button
                  type="button"
                  onClick={() => choose(option)}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm", i === active && "bg-surface")}
                >
                  {option}
                  {option === value && <Check size={14} strokeWidth={1.8} className="shrink-0 text-accent" />}
                </button>
              </li>
            ))}
            {custom && (
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => choose(custom)}
                  onMouseEnter={() => setActive(shown.length)}
                  className={cn("w-full border-t border-line px-3 py-2 text-left text-sm", active === shown.length && "bg-surface")}
                >
                  Not listed? Use <span className="font-medium">“{custom}”</span>
                </button>
              </li>
            )}
            {total === 0 && <li className="px-3 py-3 text-sm text-muted">{allowCustom ? "Type the name of your town or city." : "No matches."}</li>}
            {matches.length > shown.length && <li className="px-3 py-2 text-xs text-muted">Keep typing to narrow the list…</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

type Loaded<T> = { key: string; list: T[] };

/** Country, state and city dropdowns that feed each other. */
export function LocationFields({
  idPrefix,
  value,
  countries,
  onChange,
}: {
  idPrefix: string;
  value: LocationValue;
  countries: GeoOption[];
  onChange: (patch: Partial<LocationValue>) => void;
}) {
  const uid = useId();
  const [states, setStates] = useState<Loaded<GeoOption> | null>(null);
  const [cities, setCities] = useState<Loaded<string> | null>(null);

  // Addresses saved before the dropdowns existed carry names only, so fall back to matching by name.
  const country =
    countries.find((c) => c.code === value.countryCode) ??
    countries.find((c) => c.name.toLowerCase() === value.country.trim().toLowerCase()) ??
    null;
  const countryCode = country?.code ?? "";

  useEffect(() => {
    if (!countryCode) return;
    let cancelled = false;
    fetch(`/api/geo/${countryCode}`)
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((list: GeoOption[]) => {
        if (!cancelled) setStates({ key: countryCode, list });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const stateList = states?.key === countryCode ? states.list : null;
  const state =
    stateList?.find((s) => s.code === value.stateCode) ??
    stateList?.find((s) => s.name.toLowerCase() === value.state.trim().toLowerCase()) ??
    null;
  const stateCode = state?.code ?? "";
  const cityKey = `${countryCode}/${stateCode}`;

  useEffect(() => {
    if (!countryCode || !stateCode) return;
    let cancelled = false;
    fetch(`/api/geo/${countryCode}/${stateCode}`)
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((list: string[]) => {
        if (!cancelled) setCities({ key: `${countryCode}/${stateCode}`, list });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, stateCode]);

  const cityList = stateCode && cities?.key === cityKey ? cities.list : null;
  const ids = { country: `${idPrefix}-country-${uid}`, state: `${idPrefix}-state-${uid}`, city: `${idPrefix}-city-${uid}` };

  return (
    <>
      <div>
        <label className="field-label" htmlFor={ids.country}>
          Country
        </label>
        <select
          id={ids.country}
          required
          autoComplete="country"
          value={countryCode}
          onChange={(event) => {
            const next = countries.find((c) => c.code === event.target.value);
            onChange({ country: next?.name ?? "", countryCode: next?.code ?? "", state: "", stateCode: "", city: "" });
          }}
          className="input"
        >
          {!countryCode && <option value="">Select country</option>}
          {countries.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor={ids.state}>
          State
        </label>
        {stateList && stateList.length === 0 ? (
          // A few countries have no subdivisions in the dataset: fall back to typing.
          <input
            id={ids.state}
            required
            autoComplete="address-level1"
            value={value.state}
            onChange={(event) => onChange({ state: event.target.value, stateCode: "" })}
            className="input"
          />
        ) : (
          <select
            id={ids.state}
            required
            autoComplete="address-level1"
            disabled={!stateList}
            value={stateCode}
            onChange={(event) => {
              const next = stateList?.find((s) => s.code === event.target.value);
              onChange({ state: next?.name ?? "", stateCode: next?.code ?? "", city: "" });
            }}
            className="input disabled:opacity-50"
          >
            <option value="">{!countryCode ? "Select country first" : stateList ? "Select state" : "Loading…"}</option>
            {stateList?.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor={ids.city}>
          City
        </label>
        {stateList && stateList.length === 0 ? (
          <input
            id={ids.city}
            required
            autoComplete="address-level2"
            value={value.city}
            onChange={(event) => onChange({ city: event.target.value })}
            className="input"
          />
        ) : (
          <SearchSelect
            id={ids.city}
            required
            allowCustom
            disabled={!stateCode || !cityList}
            value={value.city}
            options={cityList ?? []}
            onChange={(city) => onChange({ city })}
            placeholder={!stateCode ? "Select state first" : cityList ? "Select city" : "Loading…"}
          />
        )}
      </div>
    </>
  );
}
