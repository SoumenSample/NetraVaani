# Blink Communication System - Backend Server

This Node.js server provides real-time communication between the ESP32 device and the web frontend using WebSocket (Socket.io) and REST endpoints.

## Setup

### 1. Install Dependencies

```bash
npm install express socket.io cors
```

### 2. Start the Server

```bash
node server/index.js
```

Server runs on port **8787** by default.

## Endpoints

### REST API

- **GET /healthz** - Health check
  ```
  Response: { "ok": true, "timestamp": "2025-..." }
  ```

- **POST /api/heartbeat** - ESP32 heartbeat
  ```json
  {
    "deviceId": "esp32-01",
    "rssi": -65,
    "battery": 85,
    "ts": 1234567890
  }
  ```

- **POST /api/blink** - ESP32 blink event
  ```json
  {
    "deviceId": "esp32-01",
    "timestamp": "2025-10-30T...",
    "count": 1
  }
  ```

### WebSocket (Socket.io)

**Client Events:**
- `hello` - Client connection handshake
  ```json
  { "app": "blink-comm", "version": "1.0.0", "deviceId": "esp32-01" }
  ```

**Server Events:**
- `status` - Device connection status
  ```json
  {
    "deviceId": "esp32-01",
    "status": "online" | "offline",
    "lastSeen": 1234567890,
    "transport": "ws"
  }
  ```

- `blink` - Blink event from device
  ```json
  {
    "deviceId": "esp32-01",
    "type": "blink",
    "count": 1,
    "timestamp": "2025-10-30T..."
  }
  ```

- `telemetry` - Device telemetry (optional)
  ```json
  {
    "deviceId": "esp32-01",
    "rssi": -65,
    "battery": 85,
    "timestamp": "2025-10-30T..."
  }
  ```

### SSE (Server-Sent Events)

- **GET /sse** - Fallback for real-time updates
  
  Streams `status`, `blink`, and `telemetry` events.

## ESP32 Integration

### Arduino Sketch Example (Pseudo-code)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER:8787";
const char* deviceId = "esp32-01";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected!");
}

void loop() {
  // Send heartbeat every 5 seconds
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 5000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Detect blink event (e.g., button press, sensor trigger)
  if (blinkDetected()) {
    sendBlink();
  }
  
  delay(100);
}

void sendHeartbeat() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/heartbeat");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"deviceId\":\"" + String(deviceId) + 
                   "\",\"rssi\":" + String(WiFi.RSSI()) + 
                   ",\"battery\":85}";
  
  int httpCode = http.POST(payload);
  Serial.printf("Heartbeat: %d\n", httpCode);
  
  http.end();
}

void sendBlink() {
  HTTPClient http;
  http.begin(String(serverUrl) + "/api/blink");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"deviceId\":\"" + String(deviceId) + "\"}";
  
  int httpCode = http.POST(payload);
  Serial.printf("Blink sent: %d\n", httpCode);
  
  http.end();
}

bool blinkDetected() {
  // Your detection logic (button, sensor, etc.)
  return digitalRead(BUTTON_PIN) == LOW;
}
```

### MQTT Alternative

For MQTT over WebSockets, use a broker like EMQX or HiveMQ:

**Topics:**
- `blink/status/<deviceId>` - Device status
- `blink/event/<deviceId>` - Blink events
- `blink/telemetry/<deviceId>` - Telemetry data

## Device Timeout

- If no heartbeat received for **15 seconds**, device is marked `offline`
- Status broadcast every **10 seconds** to keep clients updated
- Device auto-reconnects when heartbeat resumes

## Testing

### Test with curl

```bash
# Health check
curl http://localhost:8787/healthz

# Simulate heartbeat
curl -X POST http://localhost:8787/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01","rssi":-65,"battery":85}'

# Simulate blink
curl -X POST http://localhost:8787/api/blink \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"esp32-01"}'
```

### Test WebSocket with frontend

The frontend automatically connects to `VITE_WS_URL` (default: `http://localhost:8787`).

Open browser console to see connection logs.

## Production Deployment

1. **Environment variables:**
   ```
   PORT=8787
   ```

2. **CORS:** Update allowed origins in `server/index.js`

3. **SSL:** Use a reverse proxy (nginx, Caddy) for HTTPS/WSS

4. **Process manager:** Use PM2 or similar
   ```bash
   pm2 start server/index.js --name blink-server
   ```

## License

MIT
