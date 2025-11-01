import { useEffect, useState } from "react";
import { Wifi, WifiOff, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { io, Socket } from "socket.io-client";

interface DeviceEvent {
  type: "blink" | "status" | "telemetry";
  timestamp: string;
  message: string;
  deviceId?: string;
}

interface DeviceStatusCardProps {
  deviceId?: string;
  onTestBlink?: () => void;
  onDeviceStatusChange?: (isOnline: boolean) => void; // New prop to notify parent
  onBlinkEvent?: (blinkCount: number) => void; // Handle blink counting
}

const DeviceStatusCard = ({
  deviceId = "esp32-01",
  onTestBlink,
  onDeviceStatusChange,
  onBlinkEvent,
}: DeviceStatusCardProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(false); // ESP32 device status
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [transport] = useState<"ws" | "mqtt" | "sse">("ws");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Blink counting state
  const [blinkBuffer, setBlinkBuffer] = useState<number[]>([]); // Timestamps of blinks
  const [blinkCount, setBlinkCount] = useState(0);

  // Connect to WebSocket server
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8787";
    const newSocket = io(wsUrl, {
      query: { deviceId },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      const newEvent: DeviceEvent = {
        type: "status",
        timestamp: new Date().toISOString(),
        message: "Connected to server",
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      newSocket.emit("hello", { app: "blink-comm", version: "1.0.0", deviceId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      const newEvent: DeviceEvent = {
        type: "status",
        timestamp: new Date().toISOString(),
        message: "Disconnected from server",
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    });

    newSocket.on("status", (data: { deviceId: string; status: string; lastSeen: number | string }) => {
      if (data.deviceId === deviceId) {
        setLastSeen(new Date(data.lastSeen));
        setDeviceOnline(data.status === "online"); // Update device online status
        const newEvent: DeviceEvent = {
          type: "status",
          timestamp: new Date().toISOString(),
          message: `Device ${data.status}`,
          deviceId: data.deviceId,
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      }
    });

    newSocket.on("blink", (data: { deviceId: string; timestamp: string; count?: number }) => {
      if (data.deviceId === deviceId) {
        setLastSeen(new Date());
        setDeviceOnline(true); // Device is online if sending blinks
        
        // Process blink count if provided
        if (data.count && onBlinkEvent) {
          onBlinkEvent(data.count);
        }
        
        const newEvent: DeviceEvent = {
          type: "blink",
          timestamp: data.timestamp,
          message: data.count ? `Blink event: ${data.count} blinks` : "Blink event received from ESP32",
          deviceId: data.deviceId,
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      }
    });

    // Listen for blinkCount events from ESP32
    newSocket.on("blinkCount", (data: { deviceId: string; blinkCount: number; timestamp: string }) => {
      console.log("[WebSocket] blinkCount event received:", data);
      
      if (data.deviceId === deviceId && onBlinkEvent) {
        console.log(`[WebSocket] Processing blink count: ${data.blinkCount} for device: ${data.deviceId}`);
        onBlinkEvent(data.blinkCount);
        const newEvent: DeviceEvent = {
          type: "blink",
          timestamp: data.timestamp,
          message: `${data.blinkCount} blinks detected`,
          deviceId: data.deviceId,
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      }
    });

    newSocket.on("telemetry", (data: { deviceId: string; rssi?: number; battery?: number; timestamp: string }) => {
      if (data.deviceId === deviceId) {
        setDeviceOnline(true); // Device is online if sending telemetry
        const newEvent: DeviceEvent = {
          type: "telemetry",
          timestamp: data.timestamp,
          message: `Telemetry: ${data.rssi ? `RSSI ${data.rssi}dBm` : ""} ${data.battery ? `Battery ${data.battery}%` : ""}`,
          deviceId: data.deviceId,
        };
        setEvents((prev) => [newEvent, ...prev].slice(0, 50));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [deviceId]);

  // Notify parent component when device status changes
  useEffect(() => {
    onDeviceStatusChange?.(deviceOnline);
  }, [deviceOnline, onDeviceStatusChange]);

  // Update last seen timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSeen((prev) => new Date(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Time ago formatter
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const handleTestBlink = () => {
    const newEvent: DeviceEvent = {
      type: "blink",
      timestamp: new Date().toISOString(),
      message: "Test blink (simulated)",
      deviceId: "local",
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    onTestBlink?.();
  };

  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      <div className="border-b bg-card/50 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Device Status
              </h2>
              {deviceOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant={deviceOnline ? "default" : "destructive"}
                className={
                  deviceOnline
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : ""
                }
              >
                {deviceOnline ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Device ID: <span className="font-mono">{deviceId}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Transport: <span className="font-mono uppercase">{transport}</span>
              </span>
            </div>
          </div>

          {deviceOnline && (
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse text-green-600" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Last seen: <span className="font-medium">{getTimeAgo(lastSeen)}</span>
          </p>
          {import.meta.env.DEV && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestBlink}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Test Blink
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto bg-muted/20 p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          Recent Events
        </h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet...</p>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="flex items-start gap-3 rounded-lg bg-card p-2 text-sm animate-fade-in"
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                    event.type === "blink"
                      ? "bg-blue-500 animate-pulse"
                      : event.type === "status"
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DeviceStatusCard;
