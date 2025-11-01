import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useDevice } from "@/contexts/DeviceContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const morseToText: Record<string, string> = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D",
  ".": "E", "..-.": "F", "--.": "G", "....": "H",
  "..": "I", ".---": "J", "-.-": "K", ".-..": "L",
  "--": "M", "-.": "N", "---": "O", ".--.": "P",
  "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
  "..-": "U", "...-": "V", ".--": "W", "-..-": "X",
  "-.--": "Y", "--..": "Z",
  "-----": "0", ".----": "1", "..---": "2", "...--": "3",
  "....-": "4", ".....": "5", "-....": "6", "--...": "7",
  "---..": "8", "----.": "9",
};

const textToMorse: Record<string, string> = Object.entries(morseToText).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<string, string>
);

function App() {
  const navigate = useNavigate();
  const { deviceOnline, registerBlinkHandler, unregisterBlinkHandler } = useDevice();
  const [morseInput, setMorseInput] = useState("");
  const [translated, setTranslated] = useState("");
  const [isPressed, setIsPressed] = useState(false);
  const pressStart = useRef<number | null>(null);
  const lastPressEnd = useRef<number | null>(null);
  const lastActivity = useRef(Date.now());

  // Speak output
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  // Add morse symbol from blink or keyboard
  const addMorseSymbol = useCallback((symbol: "." | "-") => {
    setMorseInput((prev) => prev + symbol);
    lastPressEnd.current = Date.now();
    lastActivity.current = Date.now();
    console.log(`[MORSE] Added symbol: ${symbol}`);
  }, []);

  // Handle blink events from ESP32
  const handleBlinkEvent = useCallback((blinkCount: number) => {
    console.log(`[MORSE] Received ${blinkCount} blinks from ESP32`);
    
    if (blinkCount === 2) {
      // 2 blinks = dot
      addMorseSymbol(".");
    } else if (blinkCount === 3) {
      // 3 blinks = dash
      addMorseSymbol("-");
    }
  }, [addMorseSymbol]);

  // Register blink handler with ESP32 device
  useEffect(() => {
    console.log("[MORSE] Registering morse blink handler");
    registerBlinkHandler("morse", handleBlinkEvent);
    
    return () => {
      console.log("[MORSE] Unregistering morse blink handler");
      unregisterBlinkHandler("morse");
    };
  }, [registerBlinkHandler, unregisterBlinkHandler, handleBlinkEvent]);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPressed) {
        e.preventDefault();
        setIsPressed(true);
        pressStart.current = Date.now();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPressed) {
        e.preventDefault();
        setIsPressed(false);
        const duration = Date.now() - (pressStart.current ?? 0);
        addMorseSymbol(duration < 250 ? "." : "-");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPressed, addMorseSymbol]);

  // Detect pauses
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPressEnd.current) {
        const timeSinceLast = Date.now() - lastPressEnd.current;

        // End of letter (~2s)
        if (timeSinceLast > 6000 && morseInput.length > 0) {
          const letter = morseToText[morseInput] || "?";
          setTranslated((prev) => prev + letter);
          setMorseInput("");
          lastPressEnd.current = null;
          speak(letter);
        }

        // End of word (~3s)
        if (timeSinceLast > 8000) {
          setTranslated((prev) => prev.trim() + " ");
          lastPressEnd.current = null;
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [morseInput]);

  // Remove auto-reload and fullscreen for better integration

  // Remove auto-reload and fullscreen for better integration

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName="User" isConnected={deviceOnline} />
      
      <div className="w-full min-h-screen bg-gradient-to-br from-black to-gray-800 text-white flex flex-col items-center p-8 overflow-hidden">
        {/* Back Button */}
        <div className="w-full max-w-4xl mb-4">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="bg-white text-black hover:bg-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-5xl font-extrabold mb-6 text-yellow-400 tracking-wide animate-pulse">
          🔆 Morse Code Game
        </h1>

        <div className="bg-gray-900 border border-yellow-500 rounded-lg p-4 mb-6 max-w-2xl">
          <p className="text-center text-lg mb-2">
            {deviceOnline ? (
              <span className="text-green-400">
                ✅ Device Connected - Use blinks or keyboard
              </span>
            ) : (
              <span className="text-red-400">
                ⚠️ Device Disconnected - Use keyboard only
              </span>
            )}
          </p>
          <div className="text-center text-sm text-gray-300">
            {deviceOnline ? (
              <>
                <p><strong>Blink Controls:</strong> 2 blinks = dot (·) | 3 blinks = dash (−)</p>
                <p><strong>Keyboard:</strong> Short press Space = dot | Long press Space = dash</p>
              </>
            ) : (
              <p><strong>Keyboard:</strong> Press and hold <kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> - Short = dot (·), Long = dash (−)</p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-10">
          Wait ~2s between letters or ~3s between words
        </p>

      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-yellow-500">
        <p className="text-yellow-300 mb-3 text-lg">Morse Input:</p>
        <p className="text-3xl font-mono text-white tracking-wider">
          {morseInput || "..."}
        </p>

        <p className="text-green-300 mt-6 mb-3 text-lg">Translated:</p>
        <p className="text-3xl font-bold tracking-wider">
          {translated.trim() || "Start typing..."}
        </p>
      </div>

      {/* Fixed Morse Code Reference */}
      <div className="fixed top-20 right-6 bg-gray-900 border border-yellow-500 rounded-lg p-4 w-84 max-h-[80vh] overflow-y-auto shadow-lg">
        <h2 className="text-yellow-400 text-xl font-bold mb-2 text-center">
          Morse Code Reference
        </h2>
        <div className="grid grid-cols-3 gap-1.5 text-sm text-gray-200">
          {Object.entries(textToMorse).map(([char, code]) => (
            <div
              key={char}
              className="flex justify-between bg-gray-800 px-2 py-1 rounded hover:bg-gray-700"
            >
              <span className="font-bold text-yellow-300">{char}</span>
              <span className="font-mono text-xl">{code}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;
