// ** IMPORTANT: Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key **
const API_KEY = '400fe231827dcfb7820a4bae569869d1'; // <<< REMEMBER TO REPLACE THIS WITH YOUR KEY!

// --- DOM Element References (Existing Weather/AQI) ---
const cityInput = document.getElementById('cityInput');
const errorMessage = document.getElementById('errorMessage');

// Weather Card Elements
const weatherCard = document.getElementById('weatherResult');
const weatherCity = document.getElementById('weatherCity');
const weatherIcon = document.getElementById('weatherIcon');
const temp = document.getElementById('temp');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const pressure = document.getElementById('pressure');
const rainfallParagraph = document.getElementById('rainfallParagraph');
const rainfall = document.getElementById('rainfall');

// AQI Card Elements
const aqiCard = document.getElementById('aqiResult');
const aqiLevel = document.getElementById('aqiLevel');
const aqiStatus = document.getElementById('aqiStatus');
const pm2_5 = document.getElementById('pm2_5');
const pm10 = document.getElementById('pm10');
const co = document.getElementById('co');
const no2 = document.getElementById('no2');
const o3 = document.getElementById('o3');
const so2 = document.getElementById('so2');

// --- DOM Element References (NEW: Theme Toggle) ---
const themeToggle = document.getElementById('themeToggle');

// --- DOM Element References (NEW: Clock/Calendar) ---
const displayTime = document.getElementById('displayTime');
const displayDate = document.getElementById('displayDate');
const displayDay = document.getElementById('displayDay');

// --- DOM Element References (NEW: Stopwatch) ---
const stopwatchDisplay = document.getElementById('stopwatchDisplay');
const startStopwatchBtn = document.getElementById('startStopwatch');
const stopStopwatchBtn = document.getElementById('stopStopwatch');
const resetStopwatchBtn = document.getElementById('resetStopwatch');

// --- DOM Element References (NEW: Alarm) ---
const alarmHourInput = document.getElementById('alarmHour');
const alarmMinuteInput = document.getElementById('alarmMinute');
const alarmAmPmSelect = document.getElementById('alarmAmPm');
const setAlarmBtn = document.getElementById('setAlarm');
const clearAlarmBtn = document.getElementById('clearAlarm');
const alarmStatus = document.getElementById('alarmStatus');
const alarmTone = document.getElementById('alarmTone'); // Audio element

// --- UI Display Management Functions (Existing Weather/AQI) ---
function hideResults() {
    weatherCard.style.display = 'none';
    aqiCard.style.display = 'none';
}

function showResults() {
    weatherCard.style.display = 'block';
    aqiCard.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    hideResults();
    setTimeout(() => {
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';
    }, 6000);
}

// --- API Fetching Functions (Existing Weather/AQI) ---
async function getCoordsFromCityName(city) {
    try {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.length === 0) {
            showError(`Could not find "${city}". Please check spelling or try a different city.`);
            return null;
        }
        return data[0];
    } catch (error) {
        console.error('Error fetching city coordinates:', error);
        showError('Failed to resolve city name. Check your internet connection.');
        return null;
    }
}

async function fetchWeatherByCoords(lat, lon, cityName = null) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.cod !== 200) {
            showError(`Error fetching weather: ${data.message || 'Unknown error'}`);
            return null;
        }

        return {
            name: cityName || data.name,
            temp: data.main.temp,
            humidity: data.main.humidity,
            wind: data.wind.speed,
            pressure: data.main.pressure,
            weather: data.weather[0].description,
            icon: data.weather[0].icon,
            rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
            coord: data.coord
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data. Please check your internet connection.');
        return null;
    }
}

async function fetchAQIData(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.cod === '400' || !data.list || data.list.length === 0) {
            console.warn('AQI data not available or error fetching for this location:', data);
            return null;
        }
        return data.list[0];
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        return null;
    }
}

// --- UI Rendering Functions (Existing Weather/AQI) ---
function displayWeather(data) {
    if (!data) {
        weatherCard.style.display = 'none';
        return;
    }

    weatherCity.textContent = data.name;
    temp.textContent = data.temp.toFixed(1);
    condition.textContent = data.weather.charAt(0).toUpperCase() + data.weather.slice(1);
    humidity.textContent = data.humidity;
    wind.textContent = data.wind;
    pressure.textContent = data.pressure;

    if (data.rainfall > 0) {
        rainfallParagraph.classList.remove('hidden-detail');
        rainfall.textContent = data.rainfall.toFixed(2);
    } else {
        rainfallParagraph.classList.add('hidden-detail');
    }

    weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    weatherIcon.alt = data.weather;
    weatherIcon.classList.remove('hidden');
    weatherCard.style.display = 'block';
}

function getAQIStatus(aqi) {
    let status = '';
    let className = 'aqi-status-unknown';
    switch (aqi) {
        case 1: status = 'Good'; className = 'aqi-status-good'; break;
        case 2: status = 'Fair'; className = 'aqi-status-fair'; break;
        case 3: status = 'Moderate'; className = 'aqi-status-moderate'; break;
        case 4: status = 'Poor'; className = 'aqi-status-poor'; break;
        case 5: status = 'Very Poor'; className = 'aqi-status-very-poor'; break;
        default: status = 'Unknown'; className = 'aqi-status-unknown'; break;
    }
    return { status, className };
}

function displayAQI(data) {
    if (!data) {
        aqiCard.style.display = 'none';
        aqiLevel.textContent = '--';
        aqiStatus.textContent = '';
        aqiStatus.className = '';
        pm2_5.textContent = '--';
        pm10.textContent = '--';
        co.textContent = '--';
        no2.textContent = '--';
        o3.textContent = '--';
        so2.textContent = '--';
        return;
    }

    const { aqi } = data.main;
    const { status, className } = getAQIStatus(aqi);

    aqiLevel.textContent = aqi;
    aqiStatus.textContent = `(${status})`;
    aqiStatus.className = className;

    pm2_5.textContent = data.components.pm2_5?.toFixed(2) ?? '--';
    pm10.textContent = data.components.pm10?.toFixed(2) ?? '--';
    co.textContent = data.components.co?.toFixed(2) ?? '--';
    no2.textContent = data.components.no2?.toFixed(2) ?? '--';
    o3.textContent = data.components.o3?.toFixed(2) ?? '--';
    so2.textContent = data.components.so2?.toFixed(2) ?? '--';

    aqiCard.style.display = 'block';
}

// --- Main Event Handlers (Existing Weather/AQI) ---
async function getWeatherByCity() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    errorMessage.classList.remove('show');
    hideResults();

    const cityCoordsData = await getCoordsFromCityName(city);
    if (!cityCoordsData) {
        return;
    }

    const weatherData = await fetchWeatherByCoords(cityCoordsData.lat, cityCoordsData.lon, cityCoordsData.name);
    if (weatherData) {
        displayWeather(weatherData);

        const aqiData = await fetchAQIData(weatherData.coord.lat, weatherData.coord.lon);
        displayAQI(aqiData);

        showResults();
        localStorage.setItem('lastSearchedCity', city);
    }
}

function getLocationWeather() {
    errorMessage.classList.remove('show');
    hideResults();
    cityInput.value = '';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const weatherData = await fetchWeatherByCoords(lat, lon);
            if (weatherData) {
                displayWeather(weatherData);

                const aqiData = await fetchAQIData(lat, lon);
                displayAQI(aqiData);

                showResults();
                localStorage.setItem('lastSearchedCity', weatherData.name);
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            let message = 'Unable to retrieve your location.';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location access denied. Please enable location services in your browser settings.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Location information is unavailable.';
            } else if (error.code === error.TIMEOUT) {
                message = 'The request to get user location timed out.';
            }
            showError(message);
        });
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// --- Event Listeners and Initial Page Load (Existing Weather/AQI) ---
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeatherByCity();
    }
});

cityInput.addEventListener('change', () => {
    localStorage.setItem('lastSearchedCity', cityInput.value.trim());
});


// =========================================================
//                  NEW FEATURES INTEGRATION
// =========================================================


// --- Dark/Light Mode ---
function applyTheme(theme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light-mode';
    const newTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
    applyTheme(newTheme);
}

// Event Listener for Theme Toggle
themeToggle.addEventListener('click', toggleTheme);


// --- Digital Clock / Calendar ---
function updateClock() {
    const now = new Date();

    // Time
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    displayTime.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

    // Date
    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    displayDate.textContent = now.toLocaleDateString(undefined, optionsDate);

    // Day of the week
    const optionsDay = { weekday: 'long' };
    displayDay.textContent = now.toLocaleDateString(undefined, optionsDay);
}

// Update clock every second
setInterval(updateClock, 1000);
// Initial call to display immediately
updateClock();


// --- Stopwatch ---
let stopwatchInterval;
let stopwatchStartTime;
let stopwatchElapsedTime = 0;

function formatStopwatchTime(ms) {
    const hours = Math.floor(ms / 3600000);
    ms %= 3600000;
    const minutes = Math.floor(ms / 60000);
    ms %= 60000;
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;

    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(3, '0')
    );
}

function startStopwatch() {
    if (!stopwatchInterval) {
        stopwatchStartTime = Date.now() - stopwatchElapsedTime;
        stopwatchInterval = setInterval(() => {
            stopwatchElapsedTime = Date.now() - stopwatchStartTime;
            stopwatchDisplay.textContent = formatStopwatchTime(stopwatchElapsedTime);
        }, 10);
    }
}

function stopStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
}

function resetStopwatch() {
    stopStopwatch();
    stopwatchElapsedTime = 0;
    stopwatchDisplay.textContent = '00:00:00.000';
}

// Stopwatch Event Listeners
startStopwatchBtn.addEventListener('click', startStopwatch);
stopStopwatchBtn.addEventListener('click', stopStopwatch);
resetStopwatchBtn.addEventListener('click', resetStopwatch);


// --- Alarm Clock ---
let alarmTime = null;
let alarmCheckInterval;

// ** IMPORTANT: Replace './alarm.mp3' with the correct path to your alarm sound file! **
alarmTone.src = './alarm.mp3'; // e.g., './sounds/alarm.mp3' if in a 'sounds' folder
alarmTone.volume = 0.7; // Set initial volume

function setAlarm() {
    const hour = parseInt(alarmHourInput.value);
    const minute = parseInt(alarmMinuteInput.value);
    const ampm = alarmAmPmSelect.value;

    if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
        alarmStatus.textContent = 'Invalid time. Please enter HH (1-12) and MM (0-59).';
        alarmStatus.style.color = 'salmon';
        return;
    }

    let alarmHour24 = hour;
    if (ampm === 'PM' && hour !== 12) {
        alarmHour24 += 12;
    } else if (ampm === 'AM' && hour === 12) {
        alarmHour24 = 0;
    }

    const now = new Date();
    alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), alarmHour24, minute, 0);

    // If the alarm time is in the past for today, set it for tomorrow
    if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const displayHour = String(hour).padStart(2, '0');
    const displayMinute = String(minute).padStart(2, '0');
    alarmStatus.textContent = `Alarm set for: ${displayHour}:${displayMinute} ${ampm}`;
    alarmStatus.style.color = 'var(--value-text-color)';

    // Save alarm time and its display format to localStorage for persistence
    localStorage.setItem('alarmTime', alarmTime.toISOString());
    localStorage.setItem('alarmDisplay', `${displayHour}:${displayMinute} ${ampm}`);

    // --- Autoplay Policy Workaround: Try to play and immediately pause ---
    // This attempt to play a muted sound, triggered by a user click (Set Alarm button),
    // helps browsers "unlock" the audio context for later programmatic playback.
    alarmTone.muted = true; // Mute it for this initial play
    alarmTone.play()
        .then(() => {
            alarmTone.pause();
            alarmTone.currentTime = 0;
            alarmTone.muted = false; // Unmute it for when the actual alarm rings
            console.log("Audio context unlocked successfully.");
        })
        .catch(error => {
            console.warn("Autoplay was prevented (this is normal if no previous interaction or if muted):", error);
            alarmTone.muted = false; // Ensure it's unmuted if initial play fails
            // You might want to display a message to the user here
            // "Please interact with the page (e.g., click anywhere) to enable alarm sound."
        });
    // --- End Autoplay Policy Workaround ---


    // Start checking for alarm
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = setInterval(checkAlarm, 1000);

    console.log('Alarm set for:', alarmTime.toLocaleString());
}

function checkAlarm() {
    if (!alarmTime) return;

    const now = new Date();

    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const alarmTimeStr = `${String(alarmTime.getHours()).padStart(2, '0')}:${String(alarmTime.getMinutes()).padStart(2, '0')}`;

    if (currentTimeStr === alarmTimeStr) {
        if (alarmTone.paused) {
            alarmTone.play()
                .then(() => {
                    console.log("Alarm tone playing.");
                })
                .catch(error => {
                    console.error("Failed to play alarm tone:", error);
                    // This often happens if the audio context wasn't unlocked,
                    // or if the user's device is in silent mode.
                    alarmStatus.textContent = "ALARM! 🔔 (Sound blocked)"; // Notify user
                    alarmStatus.style.color = 'red';
                });
        }
        alarmStatus.textContent = "ALARM! 🔔🔔🔔";
        alarmStatus.style.color = '#ffeb3b';

        // Re-arm for the next day
        alarmTime.setDate(alarmTime.getDate() + 1);
        localStorage.setItem('alarmTime', alarmTime.toISOString());
        console.log("Alarm re-armed for next day:", alarmTime.toLocaleString());

    } else {
        // If alarm was ringing but current time passed it, stop tone and revert status
        if (!alarmTone.paused && (alarmStatus.textContent === "ALARM! 🔔🔔🔔" || alarmStatus.textContent === "ALARM! 🔔 (Sound blocked)")) {
             alarmTone.pause();
             alarmTone.currentTime = 0;
             const storedDisplay = localStorage.getItem('alarmDisplay');
             alarmStatus.textContent = storedDisplay ? `Alarm set for: ${storedDisplay}` : 'No alarm set';
             alarmStatus.style.color = 'var(--value-text-color)';
        }
    }
}

function clearAlarm() {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
    alarmTime = null;
    alarmTone.pause();
    alarmTone.currentTime = 0;
    alarmStatus.textContent = "No alarm set";
    alarmStatus.style.color = 'var(--value-text-color)';
    localStorage.removeItem('alarmTime');
    localStorage.removeItem('alarmDisplay');
    console.log('Alarm cleared.');
}

// Alarm Event Listeners
setAlarmBtn.addEventListener('click', setAlarm);
clearAlarmBtn.addEventListener('click', clearAlarm);

// --- Initial Load Logic ---
window.addEventListener('load', () => {
    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    applyTheme(savedTheme);

    // Existing weather/AQI load logic
    hideResults();
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        cityInput.value = lastCity;
        getWeatherByCity();
    } else {
        getLocationWeather();
    }

    // Load alarm on page load
    const savedAlarmTimeISO = localStorage.getItem('alarmTime');
    const savedAlarmDisplay = localStorage.getItem('alarmDisplay');

    if (savedAlarmTimeISO) {
        alarmTime = new Date(savedAlarmTimeISO);
        const now = new Date();
        if (alarmTime <= now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
            localStorage.setItem('alarmTime', alarmTime.toISOString());
        }
        alarmStatus.textContent = `Alarm set for: ${savedAlarmDisplay}`;
        alarmStatus.style.color = 'var(--value-text-color)';
        alarmCheckInterval = setInterval(checkAlarm, 1000);
        console.log("Loaded alarm, set for:", alarmTime.toLocaleString());
    }
});