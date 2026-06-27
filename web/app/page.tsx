"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { generateKundli, saveResult } from "@/lib/api-client";
import type { Place, HouseSystem, Ayanamsa } from "@/lib/types";

const STEPS = ["Name", "Date", "Time", "Place"] as const;

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [placeText, setPlaceText] = useState("");
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("whole_sign");
  const [ayanamsa, setAyanamsa] = useState<Ayanamsa>("lahiri");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const last = STEPS.length - 1;

  function canAdvance(): boolean {
    if (step === 1) return !!date;
    if (step === 2) return !!time;
    if (step === 3) return !!place || placeText.trim().length >= 2;
    return true; // name optional
  }

  function next() {
    setError(null);
    if (!canAdvance()) {
      setError("Please fill this in to continue.");
      return;
    }
    if (step < last) setStep(step + 1);
  }

  function back() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    setError(null);
    if (!canAdvance()) {
      setError("Please enter your birth place.");
      return;
    }
    setLoading(true);
    try {
      const result = await generateKundli({
        name,
        date,
        time,
        place: place ?? undefined,
        placeQuery: place ? undefined : placeText,
        config: { houseSystem, ayanamsa },
      });
      saveResult(result);
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && step < last) {
      e.preventDefault();
      next();
    }
  }

  return (
    <main className="wizard-wrap">
      <div className="brand">
        <span className="brand-mark">🪐</span>
        <h1>Astrochakra</h1>
      </div>
      <p className="tagline">
        Your premium Vedic birth chart — charts, dashas &amp; insights.
      </p>

      <div className="wizard-card">
        <div className="wizard-progress">
          <div
            className="wizard-progress-bar"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="wizard-step-label">
          Step {step + 1} of {STEPS.length}
        </div>

        {step === 0 && (
          <div className="wizard-step">
            <h2 className="wizard-q">What&apos;s your name?</h2>
            <input
              autoFocus
              type="text"
              value={name}
              placeholder="Full name (optional)"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        )}

        {step === 1 && (
          <div className="wizard-step">
            <h2 className="wizard-q">When were you born?</h2>
            <input
              autoFocus
              type="date"
              value={date}
              max="2100-12-31"
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h2 className="wizard-q">What time were you born?</h2>
            <input
              autoFocus
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onKeyDown={onKey}
            />
            <p className="hint">
              Exact time is essential for an accurate Ascendant (Lagna) &amp;
              houses. If unsure, use your best estimate.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <h2 className="wizard-q">Where were you born?</h2>
            <PlaceAutocomplete
              onChange={(p, text) => {
                setPlace(p);
                setPlaceText(text);
              }}
            />
            <button
              type="button"
              className="link-btn"
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? "Hide advanced options" : "Advanced options"}
            </button>
            {showAdvanced && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                <div className="field">
                  <label htmlFor="house">House system</label>
                  <select
                    id="house"
                    value={houseSystem}
                    onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}
                  >
                    <option value="whole_sign">Whole Sign (default)</option>
                    <option value="equal_house">Equal House</option>
                    <option value="placidus">Placidus</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ayan">Ayanamsa</label>
                  <select
                    id="ayan"
                    value={ayanamsa}
                    onChange={(e) => setAyanamsa(e.target.value as Ayanamsa)}
                  >
                    <option value="lahiri">Lahiri (default)</option>
                    <option value="raman">Raman</option>
                    <option value="kp">KP</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="error" style={{ marginTop: 16 }}>{error}</div>}

        <div className="wizard-actions">
          {step > 0 ? (
            <button className="btn-ghost" onClick={back} disabled={loading}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step < last ? (
            <button className="btn-primary wizard-next" onClick={next}>
              Next →
            </button>
          ) : (
            <button
              className="btn-primary wizard-next"
              onClick={submit}
              disabled={loading}
            >
              {loading && <span className="spinner" />}
              {loading ? "Calculating…" : "Generate Kundli"}
            </button>
          )}
        </div>
      </div>

      <p className="wizard-footnote">
        Free · Lahiri ayanamsa · Sidereal (Vedic) calculations
      </p>
    </main>
  );
}
