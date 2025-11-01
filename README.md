# NetraVaani - Assistive Eye-Blink Communication System# Welcome to your Lovable project



**An innovative assistive technology system enabling communication through eye blinks for individuals with limited mobility**## Project info



## 🌟 Features**URL**: https://lovable.dev/projects/d1ec1085-ceab-44b4-9a2a-f225f148e6c0



- 🎯 **Blink Detection System** - ESP32-based EOG sensor for accurate blink detection## How can I edit this code?

- 🗣️ **AI Talk Training** - Hierarchical sentence builder using blink navigation

- 🎮 **Target Game** - Interactive training game for blink coordinationThere are several ways of editing your application.

- 💡 **Smart Home Control** - MQTT-based light control via blinks

- 📱 **Responsive Dashboard** - Intuitive radial menu interface**Use Lovable**

- 🔐 **User Authentication** - MongoDB-based signup/signin system

- 📡 **Real-time Communication** - WebSocket for instant blink event transmissionSimply visit the [Lovable Project](https://lovable.dev/projects/d1ec1085-ceab-44b4-9a2a-f225f148e6c0) and start prompting.



## 🚀 Getting StartedChanges made via Lovable will be committed automatically to this repo.



### Prerequisites**Use your preferred IDE**



- Node.js (v18 or higher)If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

- MongoDB (local or cloud instance)

- ESP32 microcontroller with EOG sensorThe only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

- Mosquitto MQTT broker (optional, for light control)

Follow these steps:

### Installation

```sh

1. **Clone the repository**# Step 1: Clone the repository using the project's Git URL.

```bashgit clone <YOUR_GIT_URL>

git clone https://github.com/SoumenSample/NetraVaani.git

cd NetraVaani# Step 2: Navigate to the project directory.

```cd <YOUR_PROJECT_NAME>



2. **Install dependencies**# Step 3: Install the necessary dependencies.

```bashnpm i

npm install

cd server# Step 4: Start the development server with auto-reloading and an instant preview.

npm installnpm run dev

cd ..```

```

**Edit a file directly in GitHub**

3. **Configure environment**

Create a `.env` file in the server directory:- Navigate to the desired file(s).

```env- Click the "Edit" button (pencil icon) at the top right of the file view.

MONGODB_URI=your_mongodb_connection_string- Make your changes and commit the changes.

PORT=8787

```**Use GitHub Codespaces**



4. **Start the backend server**- Navigate to the main page of your repository.

```bash- Click on the "Code" button (green button) near the top right.

cd server- Select the "Codespaces" tab.

node index.js- Click on "New codespace" to launch a new Codespace environment.

```- Edit files directly within the Codespace and commit and push your changes once you're done.



5. **Start the frontend development server**## What technologies are used for this project?

```bash

npm run devThis project is built with:

```

- Vite

6. **Upload ESP32 firmware**- TypeScript

- Open Arduino IDE- React

- Load `esp32-firmware/blink-system-eog-mqtt.ino`- shadcn-ui

- Configure WiFi credentials and server URL- Tailwind CSS

- Upload to ESP32

## How can I deploy this project?

## 📖 How It Works

Simply open [Lovable](https://lovable.dev/projects/d1ec1085-ceab-44b4-9a2a-f225f148e6c0) and click on Share -> Publish.

### Blink Navigation Pattern

- **2 Blinks** 👁️👁️ = Navigate/Cycle through options## Can I connect a custom domain to my Lovable project?

- **3 Blinks** 👁️👁️👁️ = Select current option

- **5 Blinks** 👁️👁️👁️👁️👁️ = Go back/Emergency alertYes, you can!



### Dashboard MenuTo connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

1. **Food** - Request food assistance

2. **Water** - Request waterRead more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

3. **Toilet** - Request bathroom assistance

4. **Game** - Launch target training game
5. **AI Talk** - Open conversation builder
6. **Talk Training** - Practice sentence formation
7. **Light Control** - Toggle smart lights via MQTT

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn/ui components
- Socket.IO client for WebSocket

### Backend
- Node.js with Express
- MongoDB for user data
- Socket.IO for real-time communication
- Mosquitto MQTT for IoT control

### Hardware
- ESP32 microcontroller
- EOG (Electrooculography) sensor
- Relay modules for light control

## 📂 Project Structure

```
NetraVaani/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (DeviceContext)
│   ├── pages/          # Main application pages
│   ├── lib/            # Utility functions
│   └── hooks/          # Custom React hooks
├── server/
│   └── index.js        # Express server with WebSocket & MongoDB
├── esp32-firmware/
│   └── *.ino          # ESP32 Arduino firmware files
└── public/            # Static assets
```

## 🎯 Usage Guide

### For Caregivers
1. Ensure ESP32 device is powered and connected to WiFi
2. Open NetraVaani dashboard in browser
3. Verify device connection (green indicator)
4. Monitor user's blink commands
5. Respond to requests and emergency alerts

### For Users
1. Use 2 blinks to navigate through menu options
2. Use 3 blinks to select highlighted option
3. Use 5 blinks for emergency alerts
4. Practice with the Target Game to improve accuracy

## 🔧 Configuration

### ESP32 Firmware Settings
Edit in `esp32-firmware/blink-system-eog-mqtt.ino`:
```cpp
const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* serverUrl = "http://your_server_ip:8787";
const char* mqtt_server = "your_mqtt_broker_ip";
```

### Blink Detection Thresholds
Adjust in firmware:
```cpp
const unsigned long blinkWindow_2 = 4000;  // 2-blink window (ms)
const unsigned long blinkWindow_3 = 3000;  // 3-blink window (ms)
const unsigned long blinkWindow_5 = 3000;  // 5-blink window (ms)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with accessibility and inclusivity in mind
- Inspired by assistive technology research
- Dedicated to empowering individuals with limited mobility

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**NetraVaani** - Empowering voices through innovation 👁️💙
