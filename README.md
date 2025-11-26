# 🌌 Aether Tools | Ultra Hub (v5.0)

**Aether Tools** is a futuristic, all-in-one productivity dashboard designed with a stunning **Glassmorphism** UI and an animated **Aurora** background. It combines essential daily utilities, productivity trackers, and developer tools into a single, lightweight application.

![Status](https://img.shields.io/badge/Status-Stable-success)
![Version](https://img.shields.io/badge/Version-5.0_Ultra-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

Aether Tools is divided into three main sections, navigable via a responsive sidebar.

### 1. 📊 Dashboard (Overview)
The command center for your day.
* **🌤️ Detailed Weather:** Real-time temperature, condition, humidity, wind speed, pressure, and rainfall data. (Powered by OpenWeatherMap).
* **🫁 Advanced AQI Monitor:** Monitors Air Quality Index with detailed pollutants breakdown (PM2.5, PM10, CO, NO2, O3).
* **🧘 Zen Focus (Pomodoro):** A visual focus timer with a circular progress ring (25-minute work sessions).
* **✅ Quick Tasks:** A fast to-do list with add/delete/check functionality.
* **👋 Smart Greeting:** Personalized greeting based on the time of day and your custom username.

### 2. 🛠️ Tools (Utilities)
A suite of 9 powerful tools for everyday needs.
* **📱 QR Code Generator:** Instantly generate downloadable QR codes for any text or URL.
* **📝 Text Analytics:** Real-time counter for Words and Characters.
* **🎨 Color Studio:** Pick colors and get immediate HEX and RGB values.
* **🔐 Password Generator:** Create secure, random passwords with adjustable length (6-32 chars).
* **⚖️ Unit Converter:** Convert Length (Meters ↔ Feet) and Weight (Kg ↔ Lbs).
* **⏰ Alarm Clock:** Set custom alarms with a visual status indicator and sound.
* **📅 Calendar:** A dynamic monthly calendar that highlights the current date.
* **🧮 Calculator:** A fully functional glass-styled calculator.
* **⏱️ Stopwatch:** Precise stopwatch with Start, Stop, and Reset controls.

### 3. 📝 Sticky Notes
* **Auto-Save:** A large text area for brain dumps or reminders that automatically saves to your browser's Local Storage. You won't lose your notes even if you close the tab.

---

## 🎨 UI/UX Design

* **Glassmorphism:** Frosted glass effects on cards, sidebar, and modals using `backdrop-filter: blur()`.
* **Aurora Background:** A soothing, animated gradient background that shifts colors slowly over time.
* **Theme Engine:** One-click toggle between **Light Mode** and **Dark Mode** with persistent memory.
* **Responsive:**
    * **Desktop:** expansive 3-column Bento grid.
    * **Mobile:** App-like experience with a bottom navigation bar and vertical feed.

---

## 🚀 Getting Started

Since Aether Tools is built with vanilla web technologies, no installation or build process is required.

### Prerequisites
* A modern web browser (Chrome, Edge, Firefox, Safari).
* An internet connection (for Weather/AQI and QR Code APIs).

### Installation
1.  Download the `index.html` file.
2.  Double-click `index.html` to open it in your browser.
3.  **Done!** The app is running.

---

## ⚙️ Configuration (API Keys)

This project uses the **OpenWeatherMap API** for weather data.

To use your own API key (recommended for production or heavy use):
1.  Open `index.html` in a text editor (VS Code, Notepad++, etc.).
2.  Search for `const API_KEY`.
3.  Replace the string inside the quotes with your own key:
    ```javascript
    const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY_HERE';
    ```

---

## 💾 Data Persistence

Aether Tools uses the browser's **LocalStorage** to remember your preferences:
* User Name
* Theme (Dark/Light)
* Last Searched City
* To-Do List items
* Sticky Notes content

*Note: Clearing your browser cache/cookies will reset these data points.*

---

## 🛠️ Built With

* **HTML5:** Semantic structure.
* **CSS3:** CSS Variables, Grid/Flexbox, Animations, Media Queries.
* **JavaScript (ES6+):** Async/Await for APIs, DOM manipulation, LocalStorage logic.
* **FontAwesome:** For all icons.
* **Google Fonts:** "Outfit" typeface.
* **APIs:** OpenWeatherMap, QRServer.

---

## 🤝 Contributing

Feel free to fork this project and add your own tools!
1.  Fork the repository.
2.  Create a new feature branch.
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---

## ❤️ Acknowledgments

* Designed for **Pratham Kumar**.
* Built with ❤️.
