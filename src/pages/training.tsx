import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useDevice } from "@/contexts/DeviceContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PRONOUNS = ["I", "We", "My"] as const;
type Pronoun = typeof PRONOUNS[number];

const BASE_PHRASES = ["sleeping", "watch tv", "hungry", "help", "eat"] as const;

const activityMap: Record<string, string[]> = {
  sleep: ["go to sleep", "take a nap", "set a sleep timer", "talk about sleep schedule"],
  sleeping: ["go to sleep", "nap for 30 minutes", "adjust sleeping schedule", "sleep well wishes"],
  "watch tv": ["watch TV", "change channel", "start streaming", "recommend a show"],
  watch: ["watch TV", "watch a movie", "turn on the show", "choose what to watch"],
  eat: ["have dinner", "order food", "prepare a snack", "set mealtime reminder"],
  hungry: ["grab something to eat", "order food", "prepare a snack", "drink water"],
  help: ["call for help", "need assistance", "send emergency alert"],
};

function buildPrompt(pronoun: Pronoun, base: string, activity: string) {
  const a = activity.trim();
  if (pronoun === "My") {
    if (/^my\b/i.test(a)) return a;
    return `My ${a}`;
  }
  if (pronoun === "I") {
    if (/^(go to |take |set |watch |order |prepare |call |need |send )/i.test(a)) return `I ${a}`;
    return `I want to ${a}`;
  }
  if (/^(watch|prepare|order|start|choose|set)/i.test(a)) return `Let's ${a}`;
  return `We will ${a}`;
}

function generateSuggestions(base: string) {
  const key = base.trim().toLowerCase();
  const suggestions: string[] = [];
  if (activityMap[key]) suggestions.push(...activityMap[key]);
  const tokens = key.split(/\s+/).filter(Boolean);
  if (tokens.length) {
    const root = tokens[0];
    if (activityMap[root]) suggestions.push(...activityMap[root]);
  }
  suggestions.push(base, `think about ${base}`, `set reminder for ${base}`);
  return Array.from(new Set(suggestions)).slice(0, 8);
}

export default function TalkingSystem() {
  const navigate = useNavigate();
  const { deviceOnline, registerBlinkHandler, unregisterBlinkHandler } = useDevice();
  const [activePronoun, setActivePronoun] = useState<Pronoun>("I");
  const [basePhrase, setBasePhrase] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [blinkControlsEnabled, setBlinkControlsEnabled] = useState(true); // Auto-enabled by default
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [selectionMode, setSelectionMode] = useState<'pronoun' | 'base' | 'suggestion'>('pronoun');

  useEffect(() => {
    const loadVoices = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        setVoices(loadedVoices);
        setVoicesLoaded(true);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleBaseSelect = (base: string) => {
    setBasePhrase(base);
    setSuggestions(generateSuggestions(base));
    setSelectionMode('suggestion');
    setSelectionIndex(0);
  };

  // Register blink handler with ESP32 device
  useEffect(() => {
    console.log("[TRAINING] Registering training blink handler");
    
    const handleBlinkEvent = (blinkCount: number) => {
      console.log(`[TRAINING] Received ${blinkCount} blinks in mode: ${selectionMode}, index: ${selectionIndex}`);
      
      // 2 blinks = Navigate/Cycle through options
      if (blinkCount === 2) {
        switch (selectionMode) {
          case 'pronoun':
            setSelectionIndex((prev) => (prev + 1) % PRONOUNS.length);
            setActivePronoun(PRONOUNS[(selectionIndex + 1) % PRONOUNS.length]);
            break;
          case 'base':
            setSelectionIndex((prev) => (prev + 1) % BASE_PHRASES.length);
            break;
          case 'suggestion':
            if (suggestions.length > 0) {
              setSelectionIndex((prev) => (prev + 1) % suggestions.length);
            }
            break;
        }
      }
      
      // 3 blinks = Select current option and move to next level
      else if (blinkCount === 3) {
        switch (selectionMode) {
          case 'pronoun':
            // Pronoun selected, move to base phrase selection
            setSelectionMode('base');
            setSelectionIndex(0);
            console.log(`[TRAINING] Selected pronoun: ${activePronoun}, moving to base selection`);
            break;
          
          case 'base':
            // Base phrase selected, generate suggestions
            const selectedBase = BASE_PHRASES[selectionIndex];
            handleBaseSelect(selectedBase);
            console.log(`[TRAINING] Selected base: ${selectedBase}, moving to suggestions`);
            break;
          
          case 'suggestion':
            // Suggestion selected, speak it out
            if (suggestions.length > 0) {
              const text = buildPrompt(activePronoun, basePhrase, suggestions[selectionIndex]);
              speakText(text);
              console.log(`[TRAINING] Speaking: ${text}`);
              // Reset to pronoun selection
              setSelectionMode('pronoun');
              setSelectionIndex(0);
            }
            break;
        }
      }
      
      // 5 blinks = Go back to previous level
      else if (blinkCount === 5) {
        switch (selectionMode) {
          case 'suggestion':
            setSelectionMode('base');
            setSelectionIndex(0);
            setSuggestions([]);
            setBasePhrase("");
            console.log(`[TRAINING] Going back to base selection`);
            break;
          case 'base':
            setSelectionMode('pronoun');
            setSelectionIndex(0);
            console.log(`[TRAINING] Going back to pronoun selection`);
            break;
          case 'pronoun':
            console.log(`[TRAINING] Already at top level`);
            break;
        }
      }
    };
    
    registerBlinkHandler("training", handleBlinkEvent);
    
    return () => {
      console.log("[TRAINING] Unregistering training blink handler");
      unregisterBlinkHandler("training");
    };
  }, [registerBlinkHandler, unregisterBlinkHandler, selectionMode, selectionIndex, activePronoun, basePhrase, suggestions]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Speech Synthesis not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const englishVoice = voices.find((v) => /en/i.test(v.lang));
    if (englishVoice) utter.voice = englishVoice;
    utter.rate = 1;
    utter.pitch = 1;

    setTimeout(() => {
      window.speechSynthesis.speak(utter);
    }, 100);

    setHistory((h) => [`${new Date().toLocaleTimeString()} — ${text}`, ...h].slice(0, 20));
  };

  // Auto-cycle removed - now using manual blink navigation (2 blinks to cycle)

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg, #0ea5a4 0%, #2563eb 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Navbar */}
      <div style={{ width: "100%", marginBottom: "20px" }}>
        <Navbar userName="User" isConnected={deviceOnline} />
      </div>

      {/* Back Button */}
      <div style={{ width: "100%", maxWidth: 900, marginBottom: "10px" }}>
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          style={{ background: "white" }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div
        style={{
          background: "#ffffff",
          color: "#0f172a",
          padding: 30,
          borderRadius: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: 900,
          height: "auto",
        }}
      >
        <h1 style={{ margin: 0, textAlign: "center" }}>Talking Prompt Generator</h1>
        <p style={{ color: "#334155", textAlign: "center" }}>
          {deviceOnline 
            ? "👁️👁️ 2 blinks = Next option | 👁️👁️👁️ 3 blinks = Select | 👁️(5x) = Go back"
            : "⚠️ Device disconnected - Click options manually or connect your device"}
        </p>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ 
            padding: "8px 16px",
            borderRadius: 8,
            background: deviceOnline ? "#10b981" : "#64748b",
            color: "#fff",
            display: "inline-block",
            fontWeight: "bold",
          }}>
            {deviceOnline ? "✅ Device Connected" : "❌ Device Disconnected"}
          </div>
          {deviceOnline && blinkControlsEnabled && (
            <p style={{ color: "#334155", fontSize: 14, marginTop: 8 }}>
              <strong>Current Level:</strong> {selectionMode === 'pronoun' ? 'Perspective' : selectionMode === 'base' ? 'Base Phrase' : 'Suggestions'}
              <br />
              <strong>Highlighted:</strong> {' '}
              {selectionMode === 'pronoun' && PRONOUNS[selectionIndex]}
              {selectionMode === 'base' && BASE_PHRASES[selectionIndex]}
              {selectionMode === 'suggestion' && suggestions[selectionIndex]}
            </p>
          )}
        </div>

        {/* Pronoun Selection */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <strong>Perspective</strong>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 10 }}>
            {PRONOUNS.map((p, idx) => (
              <button
                key={p}
                onClick={() => {
                  setActivePronoun(p);
                  setSelectionIndex(idx);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: activePronoun === p ? "none" : "1px solid #e2e8f0",
                  background: activePronoun === p ? "#0ea5a4" : "#fff",
                  color: activePronoun === p ? "#fff" : "#0f172a",
                  boxShadow: blinkControlsEnabled && selectionMode === 'pronoun' && selectionIndex === idx
                    ? "0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.5)" 
                    : "none",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  fontWeight: blinkControlsEnabled && selectionMode === 'pronoun' && selectionIndex === idx ? "bold" : "normal",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Base Phrase Selection */}
        <div style={{ marginTop: 24 }}>
          <strong>Base Phrase</strong>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            {BASE_PHRASES.map((base, idx) => (
              <button
                key={base}
                onClick={() => {
                  handleBaseSelect(base);
                  setSelectionIndex(idx);
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: basePhrase === base ? "none" : "1px solid #e2e8f0",
                  background: basePhrase === base ? "#2563eb" : "#fff",
                  color: basePhrase === base ? "#fff" : "#0f172a",
                  boxShadow: blinkControlsEnabled && selectionMode === 'base' && selectionIndex === idx
                    ? "0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.5)"
                    : "none",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  fontWeight: blinkControlsEnabled && selectionMode === 'base' && selectionIndex === idx ? "bold" : "normal",
                }}
              >
                {base}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        {basePhrase && (
          <div style={{ marginTop: 24 }}>
            <strong>Suggestions</strong>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              {suggestions.map((s, i) => {
                const txt = buildPrompt(activePronoun, basePhrase, s);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      speakText(txt);
                      setSelectionIndex(i);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: "1px dashed #cbd5e1",
                      background: "#000",
                      boxShadow: blinkControlsEnabled && selectionMode === 'suggestion' && selectionIndex === i
                        ? "0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.5)"
                        : "none",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "0.2s ease",
                      fontWeight: blinkControlsEnabled && selectionMode === 'suggestion' && selectionIndex === i ? "bold" : "normal",
                    }}
                  >
                    {txt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ marginTop: 24 }}>
          <strong>History</strong>
          <div style={{ marginTop: 8, background: "#f8fafc", borderRadius: 8, padding: 10, maxHeight: 150, overflowY: "auto" }}>
            {history.length === 0 ? (
              <div style={{ color: "#64748b" }}>No messages yet.</div>
            ) : (
              history.map((h, idx) => (
                <div key={idx} style={{ padding: "6px 0", borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                  {h}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Voice Status */}
        <div style={{ marginTop: 16, textAlign: "center", color: "#64748b", fontSize: 13 }}>
          <div>Voice status: {voicesLoaded ? "✅ loaded" : "⏳ loading..."}</div>
          <div>Speech works best on Chrome / Edge with HTTPS or localhost.</div>
        </div>
      </div>
    </div>
  );
}
