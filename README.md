# Netraavani - Eye Blink Communication System

Netraavani is an innovative assistive technology system that enables communication through eye blink detection. The system uses ESP32-based hardware to detect eye blinks and translates them into meaningful communication through various interfaces including Morse code, training modules, and interactive games.

## Features

- **Real-time Eye Blink Detection**: Hardware-based EOG (Electrooculography) signal processing using ESP32
- **Multiple Communication Modes**:
  - Morse code translator
  - Interactive training modules
  - Communication games
  - Dashboard for device monitoring
- **User Management**: Secure authentication and profile management
- **Device Status Monitoring**: Real-time connection status and health monitoring
- **Responsive Web Interface**: Built with modern React and TypeScript

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- ESP32 device (for hardware component)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd blink-link-assistV6

# Install dependencies
npm install

# Start the development server
npm run dev
```

The development server will start at `http://localhost:5173`

### Backend Server Setup

```sh
# Navigate to the server directory
cd server

# Install server dependencies
npm install

# Start the server
node index.js
```

### ESP32 Firmware

The `esp32-firmware/` directory contains Arduino sketches for the eye blink detection hardware:

- `blink-system-eog-mqtt.ino` - MQTT-enabled EOG system
- `blink-system-eog.ino` - Basic EOG system
- `blink-system-v3.ino` - Version 3 of the blink detection system
- `blink-system-simple.ino` - Simplified version for testing

Upload the appropriate sketch to your ESP32 using Arduino IDE.

## Technology Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **React Router** - Client-side routing
- **Clerk** - Authentication and user management
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Socket.io** - WebSocket server
- **MQTT** - IoT messaging protocol

### Hardware
- **ESP32** - Microcontroller for eye blink detection
- **EOG Sensors** - Electrooculography signal capture

## Project Structure

```
├── src/                  # Frontend source code
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities
├── server/             # Backend server code
├── esp32-firmware/     # ESP32 Arduino sketches
└── public/             # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is part of an assistive technology initiative to help individuals with motor disabilities communicate effectively.

