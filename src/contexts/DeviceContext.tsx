import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface DeviceContextType {
  isConnected: boolean;
  deviceOnline: boolean;
  lastSeen: Date;
  registerBlinkHandler: (id: string, handler: (blinkCount: number) => void) => void;
  unregisterBlinkHandler: (id: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
};

interface DeviceProviderProps {
  children: React.ReactNode;
  deviceId?: string;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ 
  children, 
  deviceId = "esp32-01" 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [socket, setSocket] = useState<Socket | null>(null);
  // Use a ref to always have the latest handlers without triggering re-renders
  const blinkHandlersRef = useRef<Map<string, (blinkCount: number) => void>>(new Map());

  // Register a blink handler with a unique ID
  const registerBlinkHandler = useCallback((id: string, handler: (blinkCount: number) => void) => {
    console.log(`[DeviceContext] Registering blink handler: ${id}`);
    blinkHandlersRef.current.set(id, handler);
    console.log(`[DeviceContext] Active handlers: ${Array.from(blinkHandlersRef.current.keys()).join(", ")}`);
  }, []);

  // Unregister a blink handler
  const unregisterBlinkHandler = useCallback((id: string) => {
    console.log(`[DeviceContext] Unregistering blink handler: ${id}`);
    blinkHandlersRef.current.delete(id);
    console.log(`[DeviceContext] Active handlers: ${Array.from(blinkHandlersRef.current.keys()).join(", ")}`);
  }, []);

  // Connect to WebSocket server (only once)
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    console.log(`[DeviceContext] Connecting to WebSocket: ${wsUrl}`);
    
    const newSocket = io(wsUrl, {
      query: { deviceId },
    });

    newSocket.on("connect", () => {
      console.log("[DeviceContext] Connected to server");
      setIsConnected(true);
      newSocket.emit("hello", { app: "blink-comm", version: "1.0.0", deviceId });
    });

    newSocket.on("disconnect", () => {
      console.log("[DeviceContext] Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("status", (data: { deviceId: string; status: string; lastSeen: number | string }) => {
      if (data.deviceId === deviceId) {
        setLastSeen(new Date(data.lastSeen));
        setDeviceOnline(data.status === "online");
        console.log(`[DeviceContext] Device status: ${data.status}`);
      }
    });

    newSocket.on("blink", (data: { deviceId: string; timestamp: string; count?: number }) => {
      if (data.deviceId === deviceId) {
        setLastSeen(new Date());
        setDeviceOnline(true);
        
        if (data.count) {
          console.log(`[DeviceContext] Blink event: ${data.count} blinks, dispatching to ${blinkHandlersRef.current.size} handlers`);
          // Call all registered handlers
          blinkHandlersRef.current.forEach((handler, id) => {
            console.log(`[DeviceContext] Calling handler: ${id}`);
            handler(data.count!);
          });
        }
      }
    });

    newSocket.on("blinkCount", (data: { deviceId: string; blinkCount: number; timestamp: string }) => {
      console.log("[DeviceContext] blinkCount event received:", data);
      
      if (data.deviceId === deviceId) {
        console.log(`[DeviceContext] Processing blink count: ${data.blinkCount}, dispatching to ${blinkHandlersRef.current.size} handlers`);
        
        // Call all registered handlers
        blinkHandlersRef.current.forEach((handler, id) => {
          console.log(`[DeviceContext] Calling handler: ${id}`);
          handler(data.blinkCount);
        });
      }
    });

    newSocket.on("telemetry", (data: { deviceId: string; rssi?: number; battery?: number; timestamp: string }) => {
      if (data.deviceId === deviceId) {
        setDeviceOnline(true);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("[DeviceContext] Cleaning up WebSocket connection");
      newSocket.close();
    };
  }, [deviceId]); // Note: blinkHandlers is intentionally NOT in dependencies

  // Update last seen timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSeen((prev) => new Date(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value: DeviceContextType = {
    isConnected,
    deviceOnline,
    lastSeen,
    registerBlinkHandler,
    unregisterBlinkHandler,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};
