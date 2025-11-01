import React, { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useDevice } from "@/contexts/DeviceContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BlinkGame: React.FC = () => {
  const navigate = useNavigate();
  const { deviceOnline, registerBlinkHandler, unregisterBlinkHandler } = useDevice();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(
    "Blink to hit the target! 👁️👁️"
  );
  const hitZoneStart = 250;
  const hitZoneEnd = 350;
  const speed = 1;
  const targetXRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Draw function
  const draw = (ctx: CanvasRenderingContext2D, targetX: number) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Hit Zone
    ctx.fillStyle = "#b2ffb2";
    ctx.fillRect(hitZoneStart, 0, hitZoneEnd - hitZoneStart, ctx.canvas.height);

    // Target
    ctx.beginPath();
    ctx.arc(targetX, ctx.canvas.height / 2, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3333";
    ctx.fill();

    // Border
    ctx.strokeStyle = "#333";
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Animation loop
  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    targetXRef.current += speed;
    if (targetXRef.current > canvas.width) targetXRef.current = 0;

    draw(ctx, targetXRef.current);
    animationFrameRef.current = requestAnimationFrame(update);
  };

  // Hit check
  const checkHit = useCallback(() => {
    if (
      targetXRef.current >= hitZoneStart &&
      targetXRef.current <= hitZoneEnd
    ) {
      setScore((prev) => prev + 1);
      setFeedback("✅ Perfect Blink!");
      console.log("[GAME] ✅ Hit! Score:", score + 1);
    } else {
      setFeedback("❌ Miss! Try Again!");
      console.log("[GAME] ❌ Miss! Target at:", targetXRef.current);
    }
  }, [score]);

  // Handle blink event from ESP32
  const handleBlinkEvent = useCallback((blinkCount: number) => {
    console.log(`[GAME] Blink event received: ${blinkCount} blinks`);
    
    // ANY blink count triggers the hit check - works with 1, 2, 3, or 5+ blinks
    // Note: ESP32 firmware currently only sends 2, 3, or 5+ blinks
    // To enable single blink detection, modify the ESP32 firmware
    checkHit();
  }, [checkHit]);

  // Register/unregister blink handler when component mounts/unmounts
  useEffect(() => {
    console.log("[GAME] Registering game blink handler");
    registerBlinkHandler("game", handleBlinkEvent);
    
    return () => {
      console.log("[GAME] Unregistering game blink handler");
      unregisterBlinkHandler("game");
    };
  }, [registerBlinkHandler, unregisterBlinkHandler, handleBlinkEvent]);

  // Key listener (keep for fallback/testing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        console.log("[GAME] Space bar pressed (fallback)");
        checkHit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checkHit]);

  // Start animation
  useEffect(() => {
    update();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar userName="User" isConnected={deviceOnline} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Game Container */}
        <div className="rounded-lg border bg-card p-8 shadow-lg text-center">
          <h1 className="text-4xl font-bold mb-2">🎯 Target Blink Training Game</h1>
          <p className="text-muted-foreground mb-6">
            {deviceOnline 
              ? "Blink ANY number of times when the target is in the green zone!" 
              : "⚠️ Device disconnected - Connect your device or use Space bar"}
          </p>

          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="mx-auto border-2 border-border rounded-lg shadow-md bg-white"
          />

          <div
            className={`text-2xl font-bold mt-6 transition-colors ${
              feedback.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {feedback}
          </div>

          <div className="mt-4 text-3xl font-bold text-foreground">
            Score: {score}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>📍 Hit the red target when it's in the green zone</p>
            <p className="mt-2">
              {deviceOnline ? "👁️ Blink ANY number of times to attempt a hit" : "⌨️ Press Space bar to play"}
            </p>
            {deviceOnline && (
              <p className="mt-1 text-xs text-yellow-600">
                💡 Note: Current ESP32 firmware detects 2, 3, or 5 blinks (single blinks filtered as noise)
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlinkGame;
