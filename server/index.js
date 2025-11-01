/**
 * Blink Communication System - WebSocket Server
 * 
 * This server provides:
 * - Socket.io WebSocket connections for real-time device communication
 * - REST endpoints for ESP32 heartbeat and blink events
 * - SSE (Server-Sent Events) fallback support
 * 
 * Usage:
 *   npm install express socket.io cors
 *   node server/index.js
 * 
 * Environment:
 *   PORT=8787 (default)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import axios from 'axios';
import mqtt from 'mqtt';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8787;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'blink_link_assist';

// MongoDB client - will be initialized in start()
const mongoClient = new MongoClient(MONGO_URI, { connectTimeoutMS: 10000 });
let db;

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://10.147.215.22:1883';
const mqttClient = mqtt.connect(MQTT_BROKER);

// Store current light states
const lightStates = {
  light1: 'OFF',
  light2: 'OFF',
};

// MQTT Connection
mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to broker:', MQTT_BROKER);
  // Subscribe to light status topics to track state
  mqttClient.subscribe('esp32/light1', (err) => {
    if (!err) console.log('[MQTT] Subscribed to esp32/light1');
  });
  mqttClient.subscribe('esp32/light2', (err) => {
    if (!err) console.log('[MQTT] Subscribed to esp32/light2');
  });
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString().trim();
  console.log(`[MQTT] Received on ${topic}: ${msg}`);
  
  // Update light state tracking
  if (topic === 'esp32/light1') {
    lightStates.light1 = msg.toUpperCase();
  } else if (topic === 'esp32/light2') {
    lightStates.light2 = msg.toUpperCase();
  }
  
  // Broadcast light state change to all connected clients
  io.emit('lightStatus', lightStates);
});

mqttClient.on('error', (error) => {
  console.error('[MQTT] Connection error:', error);
});

// Device state management
const devices = new Map();
const HEARTBEAT_TIMEOUT = 15000; // 15 seconds

// Middleware
app.use(cors());
app.use(express.json());

// Simple helper: ensure DB is available
const ensureDb = async () => {
  if (!db) {
    await mongoClient.connect();
    db = mongoClient.db(MONGO_DB);
    console.log('[MONGO] Connected to', MONGO_URI, 'DB:', MONGO_DB);
    // Create index on email for uniqueness
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    } catch (e) {
      // ignore index creation errors
    }
  }
};

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// REST endpoint: ESP32 heartbeat
app.post('/api/heartbeat', (req, res) => {
  const { deviceId, rssi, battery, ts } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const now = Date.now();
  const device = {
    deviceId,
    status: 'online',
    lastSeen: ts || now,
    rssi,
    battery,
    updatedAt: now,
  };

  devices.set(deviceId, device);

  // Broadcast status to all connected clients
  io.emit('status', {
    deviceId,
    status: 'online',
    lastSeen: device.lastSeen,
    transport: 'ws',
  });

  // Emit telemetry if available
  if (rssi !== undefined || battery !== undefined) {
    io.emit('telemetry', {
      deviceId,
      rssi,
      battery,
      timestamp: new Date(device.lastSeen).toISOString(),
    });
  }

  res.json({ success: true, device });
});

// REST endpoint: ESP32 blink event
app.post('/api/blink', (req, res) => {
  const { deviceId, timestamp, count } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId required' });
  }

  const blinkEvent = {
    deviceId,
    type: 'blink',
    count: count || 1,
    timestamp: timestamp || new Date().toISOString(),
  };

  // Broadcast blink event to all connected clients
  io.emit('blink', blinkEvent);

  console.log(`[BLINK] Device ${deviceId} blinked ${blinkEvent.count} times`);

  res.json({ success: true, event: blinkEvent });
});

// REST endpoint: ESP32 blink count (for navigation)
app.post('/api/blink-count', (req, res) => {
  const { deviceId, blinkCount, timestamp } = req.body;

  if (!deviceId || !blinkCount) {
    return res.status(400).json({ error: 'deviceId and blinkCount required' });
  }

  // Validate blink count - only accept 1-10 blinks
  if (!Number.isInteger(blinkCount) || blinkCount < 1 || blinkCount > 10) {
    console.log(`[BLINK COUNT] Invalid blink count from ${deviceId}: ${blinkCount}, rejecting`);
    return res.status(400).json({ error: 'Invalid blinkCount: must be integer between 1-10' });
  }

  const blinkData = {
    deviceId,
    blinkCount,
    timestamp: timestamp || new Date().toISOString(),
  };

  // Broadcast blink count to all connected clients for menu navigation
  io.emit('blinkCount', blinkData);

  console.log(`[BLINK COUNT] Device ${deviceId}: ${blinkCount} blinks detected`);

  res.json({ success: true, data: blinkData });
});

// REST endpoint: Light control via MQTT
app.post('/api/light-control', (req, res) => {
  const { deviceId, light, command } = req.body;

  if (!deviceId || !light || !command) {
    return res.status(400).json({ error: 'deviceId, light, and command required' });
  }

  // Validate light and command
  if (!['light1', 'light2'].includes(light)) {
    return res.status(400).json({ error: 'light must be "light1" or "light2"' });
  }
  
  if (!['ON', 'OFF'].includes(command.toUpperCase())) {
    return res.status(400).json({ error: 'command must be "ON" or "OFF"' });
  }

  const topic = `esp32/${light}`;
  const message = command.toUpperCase();

  // Publish to MQTT
  mqttClient.publish(topic, message, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, err);
      return res.status(500).json({ error: 'Failed to send MQTT command' });
    }
    
    console.log(`[MQTT] Published to ${topic}: ${message}`);
    
    // Update local state
    lightStates[light] = message;
    
    res.json({ 
      success: true, 
      light, 
      command: message,
      timestamp: new Date().toISOString() 
    });
  });
});

// REST endpoint: Get light status
app.get('/api/light-status', (req, res) => {
  console.log('[LIGHT STATUS] Current states:', lightStates);
  res.json(lightStates);
});

// n8n webhook proxy endpoint
app.post('/api/trigger-n8n', async (req, res) => {
  try {
    const payload = req.body;
    const n8nWebhook = payload.n8nWebhook || process.env.VITE_N8N_WEBHOOK || "https://n8n.easykat.info/webhook/netravaani-emergency";
    
    // Remove n8nWebhook from payload before sending
    delete payload.n8nWebhook;
    
    console.log("[n8n] Forwarding payload to:", n8nWebhook);
    console.log("[n8n] Payload:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(n8nWebhook, payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("[n8n] Response:", response.data);
    res.json({ success: true, message: "n8n webhook triggered", data: response.data });
  } catch (error) {
    console.error("[n8n] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// REST endpoint: Signup (store user in MongoDB)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    await ensureDb();

    // Check for existing user
    const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      email: email.toLowerCase(),
      name: name || null,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await db.collection('users').insertOne(user);

    // Do not return password
    const { password: _p, ...userSafe } = user;

    res.json({ success: true, user: { id: result.insertedId, ...userSafe } });
  } catch (error) {
    console.error('[SIGNUP] Error:', error?.message || error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SSE endpoint for fallback
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial status for all devices
  devices.forEach((device) => {
    sendEvent('status', {
      deviceId: device.deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      transport: 'sse',
    });
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Handle client hello
  socket.on('hello', (data) => {
    console.log('[WS] Client hello:', data);
    
    // Send current device statuses
    devices.forEach((device) => {
      socket.emit('status', {
        deviceId: device.deviceId,
        status: device.status,
        lastSeen: device.lastSeen,
        transport: 'ws',
      });
    });
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Background task: Check device timeouts
setInterval(() => {
  const now = Date.now();
  
  devices.forEach((device, deviceId) => {
    const timeSinceUpdate = now - device.updatedAt;
    
    if (timeSinceUpdate > HEARTBEAT_TIMEOUT && device.status === 'online') {
      device.status = 'offline';
      
      io.emit('status', {
        deviceId,
        status: 'offline',
        lastSeen: device.lastSeen,
        transport: 'ws',
      });
      
      console.log(`[TIMEOUT] Device ${deviceId} marked offline`);
    }
  });
}, 5000);

// Periodic status broadcast (every 10 seconds)
setInterval(() => {
  devices.forEach((device) => {
    io.emit('status', {
      deviceId: device.deviceId,
      status: device.status,
      lastSeen: device.lastSeen,
      transport: 'ws',
    });
  });
}, 10000);

server.listen(PORT, () => {
  console.log(`[SERVER] Blink Communication Server running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/healthz`);
  console.log(`[SERVER] WebSocket: ws://localhost:${PORT}`);
  console.log(`[SERVER] SSE: http://localhost:${PORT}/sse`);
});
