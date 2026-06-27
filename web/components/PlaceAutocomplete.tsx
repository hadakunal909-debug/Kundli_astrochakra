"use client";

import { useEffect, useRef, useState } from "react";
import { geocode } from "@/lib/api-client";
import type { GeocodeResult, Place } from "@/lib/types";

interface Props {
  /** Called when the user picks a candidate (place) or edits free text (null). */
  onChange: (place: Place | null, text: string) => void;
}

export default function PlaceAutocomplete({ onChange }: Props) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced geocoding as the user types.
  useEffect(() => {
    if (picked) return; // don't re-search right after a pick
    if (text.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await geocode(text);
        setResults(r);
        setOpen(true);
        setActive(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, picked]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleType(value: string) {
    setPicked(false);
    setText(value);
    onChange(null, value); // free text — server will geocode on submit
  }

  function choose(r: GeocodeResult) {
    setPicked(true);
    setText(r.label);
    setResults([]);
    setOpen(false);
    onChange({ lat: r.lat, lon: r.lon, label: r.label }, r.label);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="autocomplete" ref={boxRef}>
      <input
        type="text"
        value={text}
        placeholder="Start typing a city, e.g. New Delhi"
        autoComplete="off"
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (results.length > 0 || loading) && (
        <ul className="autocomplete-list">
          {loading && results.length === 0 && (
            <li className="autocomplete-item">Searching…</li>
          )}
          {results.map((r, i) => (
            <li
              key={`${r.lat},${r.lon},${i}`}
              className={`autocomplete-item${i === active ? " active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(r);
              }}
            >
              {r.label}
              <small>
                {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
              </small>
            </li>
          ))}
        </ul>
      )}
      <p className="hint">
        {picked
          ? "✓ Location selected."
          : "Pick a suggestion for the most accurate coordinates & timezone."}
      </p>
    </div>
  );
}
