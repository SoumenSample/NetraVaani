import { useState, useEffect, useCallback, useMemo } from "react";
import { UtensilsCrossed, Droplet, Users as Toilet, AlertCircle, Lightbulb } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useDevice } from "@/contexts/DeviceContext";
import StatusIndicator from "@/components/StatusIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";

type ActionType = "food" | "water" | "toilet" | "game" | "training" | "morse" | "light" | "emergency";
type StatusType = "idle" | "sending" | "success" | "error";

interface MenuItem {
  id: ActionType;
  label: string;
  emoji: string;
  icon: any;
}


const Dashboard = () => {
  const Navigate = useNavigate();
  const { deviceOnline, registerBlinkHandler, unregisterBlinkHandler } = useDevice();
  const [sendingAction, setSendingAction] = useState<ActionType | null>(null);
  const [status, setStatus] = useState<StatusType>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeMenuIndex, setActiveMenuIndex] = useState(0); // Current highlighted menu
  const [lightState, setLightState] = useState(false); // Light on/off state
  const [emergencyCooldown, setEmergencyCooldown] = useState(false); // Prevent rapid emergency triggers
  
  // Menu items configuration - memoized to prevent unnecessary recreations
  const menuItems: MenuItem[] = useMemo(() => [
    { id: "food", label: "Food", emoji: "🍔", icon: UtensilsCrossed },
    { id: "water", label: "Water", emoji: "💧", icon: Droplet },
    { id: "toilet", label: "Toilet", emoji: "🚽", icon: Toilet },
    { id: "game", label: "Game", emoji: "🎮", icon: AlertCircle},
    { id: "training", label: "Ai Talk", emoji: "🗣️", icon: AlertCircle },
    { id: "morse", label: "Talk Training", emoji: "🧑", icon: AlertCircle },
    { id: "light", label: lightState ? "Light OFF" : "Light ON", emoji: "💡", icon: Lightbulb },
  ], [lightState]);
  
  // Fetch light status on component mount
  useEffect(() => {
    const fetchLightStatus = async () => {
      const backendUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
      try {
        const response = await axios.get(`${backendUrl}/api/light-status`);
        const currentLightState = response.data.light1 === "ON";
        setLightState(currentLightState);
        console.log(`[LIGHT] Initial light state: ${currentLightState ? "ON" : "OFF"}`);
      } catch (error) {
        console.error("[LIGHT] Failed to fetch initial light status:", error);
      }
    };
    
    fetchLightStatus();
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      console.log(`[SPEECH] Speaking: "${text}"`);
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('[SPEECH] Text-to-speech not supported in this browser');
    }
  }, []);

  // Play sound for basic needs
  const playSound = (type: string) => {
    const frequencies: { [key: string]: number } = {
      Food: 440, // A4
      Water: 523, // C5
      Toilet: 659, // E5
      Help: 784, // G5
      Select: 880, // A5 - confirmation sound
      Emergency: 220, // A3 - alarm sound
    };

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequencies[type] || 440;
    oscillator.type = type === "Emergency" ? "sawtooth" : "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + (type === "Emergency" ? 1.0 : 0.5)
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (type === "Emergency" ? 1.0 : 0.5));
  };

  // Handle blink event from ESP32
  const handleBlinkEvent = useCallback((blinkCount: number) => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║ BLINK EVENT RECEIVED: ${blinkCount} blinks
╚═══════════════════════════════════════════════════════════╝`);
    
    // Validate blink count - only accept 1-10 blinks, ignore invalid data
    if (!blinkCount || blinkCount < 1 || blinkCount > 10 || !Number.isInteger(blinkCount)) {
      console.log(`[BLINK] ❌ Invalid blink count: ${blinkCount}, ignoring`);
      return;
    }
    
    if (blinkCount === 1) {
      console.log(`[BLINK] ⏭️ Single blink ignored (stabilizing)`);
      return;
    }
    
    if (blinkCount === 2) {
      // Move to next menu item - SILENT NAVIGATION
      setActiveMenuIndex((prev) => {
        const nextIndex = (prev + 1) % menuItems.length;
        const nextItem = menuItems[nextIndex];
        console.log(`[NAVIGATION] 🔄 2 blinks detected`);
        console.log(`[NAVIGATION] Moving from index ${prev} (${menuItems[prev]?.label || 'unknown'}) → ${nextIndex} (${nextItem.label})`);
        console.log(`[NAVIGATION] New active menu: ${nextItem.emoji} ${nextItem.label}`);
        console.log(`[NAVIGATION] Total menu items: ${menuItems.length}`);
        
        // Speak the new menu item
        setTimeout(() => speak(nextItem.label), 0);
        
        return nextIndex;
      });
    } else if (blinkCount === 3) {
      // Select current menu item - get the current item first
      const currentIndex = menuItems.findIndex((_, idx) => idx === 0); // Will be updated by callback
      
      setActiveMenuIndex((currentIndex) => {
        const selectedItem = menuItems[currentIndex];
        console.log(`[SELECTION] ✅ 3 blinks detected`);
        console.log(`[SELECTION] Current menu index: ${currentIndex}`);
        console.log(`[SELECTION] Selecting: ${selectedItem.emoji} ${selectedItem.label}`);
        
        // Speak "Selected [menu name]" - ONLY on selection
        setTimeout(() => speak(`Selected ${selectedItem.label}`), 0);
        
        playSound("Select");
        
        // Call handleMenuSelection after a brief delay
        setTimeout(() => handleMenuSelection(selectedItem), 0);
        
        return currentIndex; // Don't change index
      });
    } else if (blinkCount >= 5) {
      // Emergency trigger - only for exactly 5 blinks to avoid false positives
      if (blinkCount === 5) {
        console.log(`[EMERGENCY] 🚨 5 blinks detected - TRIGGERING EMERGENCY!`);
        speak("Emergency! Calling for help!");
        playSound("Emergency");
        handleEmergency();
      } else {
        console.log(`[BLINK] ⚠️ Unusual blink count (${blinkCount}), ignoring to prevent false emergency`);
      }
    }
  }, [menuItems, speak]);

  // Register/unregister blink handler when component mounts/unmounts
  useEffect(() => {
    console.log("[DASHBOARD] Registering dashboard blink handler");
    console.log(`[DASHBOARD] Current active menu index: ${activeMenuIndex}`);
    console.log(`[DASHBOARD] Menu items count: ${menuItems.length}`);
    registerBlinkHandler("dashboard", handleBlinkEvent);
    
    return () => {
      console.log("[DASHBOARD] Unregistering dashboard blink handler");
      unregisterBlinkHandler("dashboard");
    };
  }, [registerBlinkHandler, unregisterBlinkHandler, handleBlinkEvent, activeMenuIndex, menuItems.length]);

  // Handle menu selection
  const handleMenuSelection = async (item: MenuItem, index?: number) => {
    // Update active menu index if provided (from click)
    if (index !== undefined) {
      setActiveMenuIndex(index);
      // Speak the selected menu when clicked
      speak(`Selected ${item.label}`);
    }
    
    if (item.id === "light") {
      // Toggle light
      await toggleLight();
    }
    else if(item.id==="game"){
      console.log("hello");
      Navigate("/game");
    }
    else if(item.id==="training"){
      console.log("hello");
      Navigate("/training");
    }
    else if(item.id==="morse"){
      console.log("Navigating to morse");
      Navigate("/morse");
    }
     else if (item.id !== "emergency") {
      // Handle basic need
      await handleBasicNeed(item.id as ActionType, item.label, item.emoji);
    }
    // Reset to first menu after 3 seconds
    setTimeout(() => setActiveMenuIndex(0), 3000);
  };

  // Send to backend n8n proxy
  const sendToWebhook = async (payload: any) => {
    const backendUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    const n8nWebhook = import.meta.env.VITE_N8N_WEBHOOK || "https://n8n.easykat.info/webhook/netravaani-emergency";
    
    console.log("[WEBHOOK] Sending to backend:", backendUrl);
    console.log("[WEBHOOK] Payload:", payload);
    
    try {
      // Send to backend first, which will forward to n8n
      const response = await axios.post(`${backendUrl}/api/trigger-n8n`, {
        ...payload,
        n8nWebhook,
      });
      console.log("[WEBHOOK] ✓ Backend response:", response.data);
      return response;
    } catch (error) {
      console.error("[WEBHOOK] ✗ Backend request failed:", error);
      if (axios.isAxiosError(error)) {
        console.error("[WEBHOOK] Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      throw error;
    }
  };

  // Toggle light state
  const toggleLight = async () => {
    const backendUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    const deviceId = import.meta.env.VITE_DEVICE_ID || "esp32-01";
    
    try {
      // First, get current light status from backend/MQTT
      console.log("[LIGHT] Checking current light status...");
      const statusResponse = await axios.get(`${backendUrl}/api/light-status`);
      const currentLightState = statusResponse.data.light1 === "ON"; // Check light1 status
      
      console.log(`[LIGHT] Current light state: ${currentLightState ? "ON" : "OFF"}`);
      
      // Toggle based on current state
      const newState = !currentLightState;
      setLightState(newState);
      
      // Send MQTT command via backend
      await axios.post(`${backendUrl}/api/light-control`, {
        deviceId,
        light: "light1", // Control light1
        command: newState ? "ON" : "OFF",
      });
      
      setStatus("success");
      setStatusMessage(`Light ${newState ? "ON" : "OFF"}`);
      speak(`Light ${newState ? "turned on" : "turned off"}`);
      
    } catch (error) {
      console.error("Failed to toggle light:", error);
      setStatus("error");
      setStatusMessage("Light control failed");
    }
    
    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 2000);
  };
  const handlegame=()=>{
    console.log("hello");
    Navigate("/game");
  }

  const handleBasicNeed = async (action: ActionType, item: string, emoji: string) => {
    console.log(`[BASIC NEED] Starting handleBasicNeed for: ${item}`);
    setSendingAction(action);
    setStatus("sending");

    // Play sound
    playSound(item);

    // Get profile data from localStorage
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");
    const medicalData = JSON.parse(localStorage.getItem("medicalData") || "{}");

    console.log("[BASIC NEED] Profile Data:", profileData);
    console.log("[BASIC NEED] Caretaker Phone:", profileData.caretakerPhone);

    // Warn if profile data missing but don't block
    if (!profileData.caretakerPhone || profileData.caretakerPhone === "N/A") {
      console.warn("[BASIC NEED] ⚠️ No caretaker phone number set in profile - SMS may not work!");
    }

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    try {
      console.log("[BASIC NEED] Sending to webhook...");
      await sendToWebhook({
        type: "need",
        clicked: `${emoji} ${item}`,  // Add 'clicked' field for n8n
        action: `${emoji} ${item}`,
        item: `${emoji} ${item}`,
        option: `${emoji} ${item}`,
        timestamp: timestamp,
        time: timestamp,
        caretaker_name: profileData.caretakerName || "Unknown",
        caretaker_phone: profileData.caretakerPhone || "N/A",
        patient_name: profileData.name || "Unknown Patient",
        name: profileData.name || "Unknown Patient",
        patient_phone: profileData.phone || "N/A",
        patient_email: profileData.email || "N/A",
        patient_address: profileData.address || "N/A",
      });
      console.log("[BASIC NEED] ✓ Primary webhook sent successfully");

      // Also call netravaani-emergency webhook with menu selection
      console.log(`[MENU SELECTION] 📋 Calling netravaani-emergency webhook for: ${item}`);
      try {
        const response = await axios.post("https://n8n.easykat.info/webhook/netravaani-emergency", {
          type: "menu_selection",
          menu_name: item,
          menu_item: `${emoji} ${item}`,
          selected_option: item,
          timestamp: timestamp,
          iso_timestamp: new Date().toISOString(),
          patient_name: profileData.name || "Unknown Patient",
          patient_phone: profileData.phone || "N/A",
          patient_email: profileData.email || "N/A",
          patient_address: profileData.address || "N/A",
          caretaker_name: profileData.caretakerName || "Unknown",
          caretaker_phone: profileData.caretakerPhone || "N/A",
        });
        console.log(`[MENU SELECTION] ✓ netravaani-emergency webhook triggered successfully for: ${item}`, response.data);
      } catch (webhookError) {
        console.error("[MENU SELECTION] ✗ Failed to trigger netravaani-emergency webhook:", webhookError);
        if (axios.isAxiosError(webhookError)) {
          console.error("[MENU SELECTION] Error details:", {
            message: webhookError.message,
            status: webhookError.response?.status,
            data: webhookError.response?.data
          });
        }
      }

      setStatus("success");
      setStatusMessage(item);
      console.log("[BASIC NEED] ✓ Request completed successfully");
    } catch (error) {
      console.error("[BASIC NEED] ✗ Failed to send:", error);
      if (axios.isAxiosError(error)) {
        console.error("[BASIC NEED] Axios error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      setStatus("error");
      setStatusMessage("Failed to send");
    }

    setSendingAction(null);

    // Reset status after 2 seconds
    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 2000);
  };

  const handleEmergency = async () => {
    // Prevent rapid repeated triggers
    if (emergencyCooldown || sendingAction === "emergency") {
      console.log("[EMERGENCY] Cooldown active, ignoring duplicate trigger");
      return;
    }

    console.log("[EMERGENCY] 🚨 Emergency triggered!");
    setEmergencyCooldown(true);
    setSendingAction("emergency");
    setStatus("sending");

    // Get profile and medical data
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");
    const medicalData = JSON.parse(localStorage.getItem("medicalData") || "{}");

    console.log("[EMERGENCY] Profile Data:", profileData);
    console.log("[EMERGENCY] Medical Data:", medicalData);

    // Warn if profile data missing but don't block
    if (!profileData.caretakerPhone || profileData.caretakerPhone === "N/A") {
      console.warn("[EMERGENCY] ⚠️ No caretaker phone number set in profile - calls/SMS may not work!");
    }

    try {
      // Send to main webhook
      console.log("[EMERGENCY] Sending to main webhook...");
      await sendToWebhook({
        type: "emergency",
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        patient: {
          name: profileData.name || "Unknown Patient",
          phone: profileData.phone || "N/A",
          email: profileData.email || "N/A",
          address: profileData.address || "N/A",
          patient_id: medicalData.patientId || "N/A",
          hospital_name: medicalData.hospitalName || "Unknown Hospital",
          hospital_address: medicalData.hospitalAddress || "N/A",
          hospital_phone: medicalData.hospitalPhone || "N/A",
          caretaker_name: profileData.caretakerName || "Unknown",
          caretaker_phone: profileData.caretakerPhone || "N/A",
        },
      });
      console.log("[EMERGENCY] ✓ Main webhook sent successfully");

      // Call n8n call-agent webhook for voice agent
      console.log("[EMERGENCY] 📞 Triggering call agent webhook...");
      const callAgentUrl = "https://n8n.easykat.info/webhook/netraavani-call-agent";
      console.log("[EMERGENCY] Call agent URL:", callAgentUrl);
      
      try {
        const callAgentPayload = {
          type: "emergency",
          patient_name: profileData.name || "Unknown Patient",
          patient_phone: profileData.phone || "N/A",
          patient_email: profileData.email || "N/A",
          patient_address: profileData.address || "N/A",
          patient_id: medicalData.patientId || "N/A",
          hospital_name: medicalData.hospitalName || "Unknown Hospital",
          hospital_address: medicalData.hospitalAddress || "N/A",
          hospital_phone: medicalData.hospitalPhone || "N/A",
          caretaker_name: profileData.caretakerName || "Unknown",
          caretaker_phone: profileData.caretakerPhone || "N/A",
          timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          emergency_time: new Date().toISOString(),
        };
        
        console.log("[EMERGENCY] Call agent payload:", callAgentPayload);
        
        const callResponse = await axios.post(callAgentUrl, callAgentPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        });
        
        console.log("[EMERGENCY] ✓ Call agent webhook triggered successfully");
        console.log("[EMERGENCY] Call agent response:", callResponse.data);
      } catch (callError) {
        console.error("[EMERGENCY] ✗ Call agent webhook failed:", callError);
        if (axios.isAxiosError(callError)) {
          console.error("[EMERGENCY] Call agent error details:", {
            message: callError.message,
            status: callError.response?.status,
            statusText: callError.response?.statusText,
            data: callError.response?.data,
            url: callError.config?.url,
          });
          
          // Show user-friendly error
          if (callError.code === 'ECONNABORTED') {
            console.error("[EMERGENCY] ⏱️ Call agent request timed out");
          } else if (callError.response?.status === 404) {
            console.error("[EMERGENCY] 🔍 Call agent webhook URL not found - check n8n workflow");
          } else if (callError.response?.status === 500) {
            console.error("[EMERGENCY] ⚠️ Call agent webhook server error");
          }
        }
        // Don't fail the whole emergency if call agent fails
        console.log("[EMERGENCY] ⚠️ Continuing despite call agent error...");
      }

      setStatus("success");
      setStatusMessage("Emergency");
      console.log("[EMERGENCY] ✓ Emergency request completed");
    } catch (error) {
      console.error("[EMERGENCY] ✗ Failed to send emergency:", error);
      if (axios.isAxiosError(error)) {
        console.error("[EMERGENCY] Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      setStatus("error");
      setStatusMessage("Emergency failed");
    }

    setSendingAction(null);

    setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 2000);

    // Keep cooldown active for 5 seconds to prevent accidental re-triggers
    setTimeout(() => {
      setEmergencyCooldown(false);
      console.log("[EMERGENCY] Cooldown reset");
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e4eafa] to-[#c1eff9] relative overflow-hidden">
      <Navbar userName="User" isConnected={deviceOnline} />
      
      <main className="relative z-10">
        {/* Title Section */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-5xl font-black text-[#2c2c3e] mb-2">
            Blink Communication System
          </h1>
          <p className="text-2xl text-gray-600 font-medium">
            Your voice, simplified 🗣️
          </p>
        </div>

        {/* Blink Instructions */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-md">
            <strong className="text-gray-700">Navigate:</strong> 2 blinks
          </div>
          <div className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-md">
            <strong className="text-gray-700">Select:</strong> 3 blinks
          </div>
          <div className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-xl shadow-md">
            <strong className="text-gray-700">Emergency:</strong> 5 blinks
          </div>
        </div>

        {/* Adaptive Gaze Grid Container */}
        <div className="relative w-[85vw] h-[55vh] mx-auto bg-white/35 backdrop-blur-[20px] rounded-[40px] shadow-[0_8px_32px_rgba(31,38,135,0.25)] flex items-center justify-center">
          
          {/* Radial Container - Background orbs */}
          <div className="absolute w-full h-full top-0 left-0">
            {menuItems.slice(1, 4).map((item, index) => {
              const Icon = item.icon;
              const isLight = item.id === "light";
              
              // Position mapping for 3 radial orbs (top corners + bottom left)
              const positions = [
                { left: '28%', top: '15%' },    // Top left - Water
                { right: '28%', top: '15%' },   // Top right - Toilet
                { left: '28%', bottom: '15%' }, // Bottom left - Game
              ];
              
              const position = positions[index];
              
              // Get color based on item
              const getOrbStyle = (itemId: string) => {
                if (itemId === 'water') return 'linear-gradient(135deg, #74c7f7 0%, #3ba3e0 100%)';
                if (itemId === 'toilet') return 'linear-gradient(135deg, #d4b5fb 0%, #a47fe6 100%)';
                if (itemId === 'game') return 'linear-gradient(135deg, #c17ffb 0%, #9350e0 100%)';
                if (itemId === 'training') return 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)';
                if (itemId === 'morse') return 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)';
                if (itemId === 'light') return lightState 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' 
                  : 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)';
                return 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)';
              };
              
              const textColor = (itemId: string) => {
                if (itemId === 'light' && !lightState) return 'text-gray-800';
                return 'text-white';
              };
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuSelection(item, index + 1)}
                  disabled={sendingAction === item.id}
                  className={`
                    absolute w-[130px] h-[130px] rounded-full backdrop-blur-xl
                    flex flex-col items-center justify-center
                    font-bold shadow-[0_4px_16px_rgba(0,0,0,0.15)]
                    transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    hover:scale-110 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    cursor-pointer z-[5] ${textColor(item.id)}
                  `}
                  style={{
                    ...position,
                    background: getOrbStyle(item.id)
                  }}
                >
                  <span className="text-5xl mb-2">{item.emoji}</span>
                  <span className="text-lg font-bold">{item.label}</span>
                  {sendingAction === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            })}
            
            {/* Additional items (AI Talk, Talk Training, Light) - positioned around */}
            {menuItems.slice(4, 7).map((item, index) => {
              const Icon = item.icon;
              const isLight = item.id === "light";
              
              const additionalPositions = [
                { left: '10%', top: '45%' },      // Middle left - AI Talk
                { right: '10%', top: '45%' },     // Middle right - Talk Training
                { right: '28%', bottom: '15%' },  // Bottom right - Light
              ];
              
              const position = additionalPositions[index];
              
              const getOrbStyle = (itemId: string) => {
                if (itemId === 'training') return 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)';
                if (itemId === 'morse') return 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)';
                if (itemId === 'light') return lightState 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' 
                  : 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)';
                return 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)';
              };
              
              const textColor = (itemId: string) => {
                if (itemId === 'light' && !lightState) return 'text-gray-800';
                return 'text-white';
              };
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuSelection(item, index + 4)}
                  disabled={sendingAction === item.id}
                  className={`
                    absolute w-[130px] h-[130px] rounded-full backdrop-blur-xl
                    flex flex-col items-center justify-center
                    font-bold shadow-[0_4px_16px_rgba(0,0,0,0.15)]
                    transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    hover:scale-110 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    cursor-pointer z-[5] ${textColor(item.id)}
                  `}
                  style={{
                    ...position,
                    background: getOrbStyle(item.id)
                  }}
                >
                  <span className="text-5xl mb-2">{item.emoji}</span>
                  <span className="text-lg font-bold">{item.label}</span>
                  {sendingAction === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Orb - HIGHEST Z-INDEX */}
          <button
            onClick={() => handleMenuSelection(menuItems[activeMenuIndex], activeMenuIndex)}
            disabled={sendingAction === menuItems[activeMenuIndex].id}
            className={`
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[240px] h-[240px] rounded-full
              flex flex-col items-center justify-center
              text-3xl font-bold cursor-pointer z-50
              transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
              shadow-[0_0_35px_rgba(255,193,7,0.8),0_8px_24px_rgba(0,0,0,0.2)]
              ${sendingAction === menuItems[activeMenuIndex].id ? 'opacity-70' : ''}
            `}
            style={{
              background: (() => {
                const item = menuItems[activeMenuIndex];
                if (item.id === 'food') return 'radial-gradient(circle at 55% 45%, #ffe5ae 0%, #ffa726 100%)';
                if (item.id === 'water') return 'linear-gradient(135deg, #74c7f7 0%, #3ba3e0 100%)';
                if (item.id === 'toilet') return 'linear-gradient(135deg, #d4b5fb 0%, #a47fe6 100%)';
                if (item.id === 'game') return 'linear-gradient(135deg, #c17ffb 0%, #9350e0 100%)';
                if (item.id === 'training') return 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)';
                if (item.id === 'morse') return 'linear-gradient(135deg, #20c997 0%, #0ca678 100%)';
                if (item.id === 'light') return lightState 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' 
                  : 'linear-gradient(135deg, #ffe066 0%, #ffbb00 100%)';
                return 'radial-gradient(circle at 55% 45%, #ffe5ae 0%, #ffa726 100%)';
              })(),
              color: menuItems[activeMenuIndex].id === 'light' && !lightState ? '#333' : 
                     ['food'].includes(menuItems[activeMenuIndex].id) ? '#333' : 'white'
            }}
          >
            {/* Dwell Ring Animation */}
            <div className="absolute -top-2 -left-2 w-[256px] h-[256px] rounded-full border-[8px] border-transparent border-t-[#ffe066] border-r-[#ffe066] animate-spin" style={{ animationDuration: '3s' }}></div>
            
            <span className="text-6xl mb-2">{menuItems[activeMenuIndex].emoji}</span>
            <span className="text-3xl font-black">{menuItems[activeMenuIndex].label}</span>
            
            {sendingAction === menuItems[activeMenuIndex].id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>

          {/* Emergency Orb - Bottom Right */}
          <button
            onClick={handleEmergency}
            disabled={sendingAction !== null || emergencyCooldown}
            className={`
              absolute right-[3%] bottom-[8%] w-[130px] h-[130px] rounded-full
              bg-gradient-to-br from-[#ff4757] to-[#d63031]
              flex flex-col items-center justify-center
              text-white font-black cursor-pointer z-[15]
              shadow-[0_0_25px_rgba(255,71,87,0.6),0_6px_18px_rgba(0,0,0,0.3)]
              transition-all duration-300
              ${emergencyCooldown ? '' : 'animate-pulse-slow'}
              hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="text-5xl">🚨</span>
            <span className="text-sm mt-1">EMERGENCY</span>
          </button>
        </div>

        {/* Emergency Overlay */}
        {sendingAction === 'emergency' && (
          <div 
            className="fixed inset-0 bg-[rgba(214,48,49,0.95)] flex items-center justify-center z-[1000]"
            style={{
              animation: 'flashEmergency 0.5s infinite'
            }}
          >
            <div className="text-center text-white">
              <h2 className="text-7xl font-black mb-6">🚨 EMERGENCY ACTIVATED 🚨</h2>
              <p className="text-4xl font-semibold">Calling caretaker and hospital...</p>
            </div>
          </div>
        )}
      </main>

      <StatusIndicator status={status} message={statusMessage} />
      
      {/* Add emergency flash animation */}
      <style>{`
        @keyframes flashEmergency {
          0%, 100% { background: rgba(214, 48, 49, 0.95); }
          50% { background: rgba(255, 71, 87, 0.98); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
