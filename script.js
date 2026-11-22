
const API = {
    weather: "https://api.open-meteo.com/v1/forecast",
    geocoding: "https://geocoding-api.open-meteo.com/v1/search",
    reverse: "https://api.bigdatacloud.net/data/reverse-geocode-client"
};

let weatherData = null;
let currentCity = "သင့်တည်နေရာ";
let speechMessage = "";
let weatherLoaded = false;
let autoSpeakAttempted = false;
let speechUnlocked = false;

const weatherTypes = {
    0: ["ကောင်းကင်ကြည်လင်နေပါတယ်", "☀️"],
    1: ["အနည်းငယ်သာ တိမ်ရှိပါတယ်", "🌤️"],
    2: ["တိမ်အသင့်အတင့်ရှိပါတယ်", "⛅"],
    3: ["တိမ်ထူထပ်နေပါတယ်", "☁️"],
    45: ["မြူတွေဆိုင်းနေပါတယ်", "🌫️"],
    48: ["မြူတွေထူထပ်နေပါတယ်", "🌫️"],
    51: ["မိုးဖွဲလေးတွေ ရွာနေပါတယ်", "🌦️"],
    53: ["မိုးဖွဲရွာနေပါတယ်", "🌦️"],
    55: ["မိုးဖွဲများနေပါတယ်", "🌧️"],
    61: ["မိုးအနည်းငယ်ရွာနေပါတယ်", "🌧️"],
    63: ["မိုးအသင့်အတင့်ရွာနေပါတယ်", "🌧️"],
    65: ["မိုးသည်းထန်စွာရွာနေပါတယ်", "🌧️"],
    71: ["နှင်းကျနေပါတယ်", "🌨️"],
    73: ["နှင်းအသင့်အတင့်ကျနေပါတယ်", "🌨️"],
    75: ["နှင်းများစွာကျနေပါတယ်", "❄️"],
    80: ["မိုးရေစက်တွေ ကျနေပါတယ်", "🌦️"],
    81: ["မိုးရွာနိုင်ပါတယ်", "🌧️"],
    82: ["မိုးသည်းထန်နိုင်ပါတယ်", "⛈️"],
    95: ["မိုးကြိုးမုန်တိုင်း ဖြစ်နေပါတယ်", "⛈️"],
    96: ["မိုးသီးပါကျနိုင်ပါတယ်", "⛈️"],
    99: ["မိုးသီးမုန်တိုင်း ဖြစ်နိုင်ပါတယ်", "⛈️"]
};

// ===============================
// CLOCK
// ===============================

function updateClock() {
    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-US", {
            timeZone: "Asia/Yangon",
            hour12: true
        });

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString("my-MM", {
            timeZone: "Asia/Yangon",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    const hour = Number(
        new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Yangon",
            hour: "numeric",
            hourCycle: "h23"
        }).format(now)
    );

    let greeting = "မင်္ဂလာပါ";

    if (hour >= 5 && hour < 12) {
        greeting = "Good Morning ☀️";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon 🌤️";
    } else if (hour >= 17 && hour < 21) {
        greeting = "Good Evening 🌆";
    } else {
        greeting = "Good Night 🌙";
    }

    document.getElementById("greeting").textContent = greeting;
}

updateClock();
setInterval(updateClock, 1000);

// ===============================
// LOCATION
// ===============================

function getLocation() {
    if (!navigator.geolocation) {
        showStatus("GPS အသုံးပြုလို့မရပါ");
        return;
    }

    document.getElementById("location").textContent =
        "Location ရယူနေသည်...";

    navigator.geolocation.getCurrentPosition(
        async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                await getCityName(lat, lon);
                await getWeather(lat, lon);
            } catch (error) {
                console.error(error);
                showStatus("Weather ရယူရာတွင် အမှားဖြစ်နေပါသည်");
            }
        },
        error => {
            console.error(error);

            document.getElementById("location").textContent =
                "Location ခွင့်ပြုချက်လိုအပ်ပါသည်";

            showStatus("GPS ကို Allow ပေးပါ သို့မဟုတ် မြို့ကိုကိုယ်တိုင်ရှာပါ");
        },
        {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000
        }
    );
}

// ===============================
// REVERSE GEOCODING
// ===============================

async function getCityName(lat, lon) {
    const url =
        `${API.reverse}?latitude=${lat}&longitude=${lon}&localityLanguage=my`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Reverse geocoding failed");
    }

    const data = await response.json();

    currentCity =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        "သင့်တည်နေရာ";

    document.getElementById("location").textContent = currentCity;
}

// ===============================
// SEARCH CITY
// ===============================

async function searchCity() {
    const city = document.getElementById("cityInput").value.trim();

    if (!city) {
        alert("မြို့နာမည်ထည့်ပေးပါ");
        return;
    }

    try {
        document.getElementById("location").textContent =
            "မြို့ကို ရှာနေသည်...";

        const url =
            `${API.geocoding}?name=${encodeURIComponent(city)}&count=1&language=my&format=json`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            alert("ဒီမြို့နာမည်ကို ရှာမတွေ့ပါ");
            return;
        }

        const place = data.results[0];

        currentCity = place.name;

        document.getElementById("location").textContent =
            currentCity;

        await getWeather(place.latitude, place.longitude);

    } catch (error) {
        console.error(error);
        alert("မြို့ရှာရာမှာ အမှားတစ်ခုဖြစ်နေပါတယ်");
    }
}

// ===============================
// WEATHER
// ===============================

async function getWeather(lat, lon) {
    const url =
        `${API.weather}?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=Asia%2FYangon`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Weather API error");
    }

    const data = await response.json();

    weatherData = data;
    weatherLoaded = true;

    displayWeather(data);
    createSpeech(data);

    // Auto speak after Weather data loads
    if (!autoSpeakAttempted) {
        autoSpeakAttempted = true;

        setTimeout(() => {
            tryAutoSpeak();
        }, 1800);
    }
}

// ===============================
// DISPLAY WEATHER
// ===============================

function displayWeather(data) {
    const current = data.current;
    const daily = data.daily;

    const weather = weatherTypes[current.weather_code] ||
        ["ရာသီဥတု အခြေအနေ မသိရသေးပါ", "🌤️"];

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("weatherDescription").textContent =
        weather[0];

    document.getElementById("weatherIcon").textContent =
        weather[1];

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("wind").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("rain").textContent =
        (current.precipitation_probability ?? 0) + "%";

    document.getElementById("maxTemp").textContent =
        Math.round(daily.temperature_2m_max[0]) + "°C";

    document.getElementById("minTemp").textContent =
        Math.round(daily.temperature_2m_min[0]) + "°C";

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature) + "°C";

    document.getElementById("updated").textContent =
        "နောက်ဆုံးရယူချိန်: " +
        new Date().toLocaleTimeString("my-MM", {
            timeZone: "Asia/Yangon"
        });
}

// ===============================
// CREATE BURMESE SPEECH
// ===============================

function createSpeech(data) {
    const current = data.current;
    const daily = data.daily;

    const weather = weatherTypes[current.weather_code] ||
        ["ရာသီဥတု သာယာနေပါတယ်", "🌤️"];

    const temperature = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const wind = Math.round(current.wind_speed_10m);
    const rain = current.precipitation_probability ?? 0;
    const max = Math.round(daily.temperature_2m_max[0]);
    const min = Math.round(daily.temperature_2m_min[0]);

    let advice = "";

    if (rain >= 60) {
        advice =
            "ဒီနေ့ မိုးရွာနိုင်ခြေများတဲ့အတွက် အပြင်သွားမယ်ဆိုရင် ထီးဆောင်သွားဖို့ မမေ့နဲ့နော်။";
    } else if (temperature >= 35) {
        advice =
            "ဒီနေ့ ရာသီဥတုပူနိုင်လို့ ရေများများသောက်ပေးပါနော်။";
    } else if (temperature <= 18) {
        advice =
            "ဒီနေ့ အေးတဲ့အတွက် အပြင်ထွက်ရင် အနွေးထည်လေး ဝတ်သွားပါနော်။";
    } else {
        advice =
            "ဒီနေ့လည်း ကိုယ့်အလုပ်တွေ အဆင်ပြေပါစေနော်။";
    }

    speechMessage =
        `မင်္ဂလာနံနက်ခင်းပါ ကိုရဲသူရ။ ` +
        `ဒီနေ့ ${currentCity} မှာ ရာသီဥတုက ${weather[0]}။ ` +
        `လက်ရှိအပူချိန်က ${temperature} ဒီဂရီစင်တီဂရိတ်ရှိပါတယ်။ ` +
        `အမြင့်ဆုံးအပူချိန်က ${max} ဒီဂရီ၊ ` +
        `အနိမ့်ဆုံးက ${min} ဒီဂရီရှိပါမယ်။ ` +
        `စိုထိုင်းဆ ${humidity} ရာခိုင်နှုန်းရှိပြီး ` +
        `လေတိုက်နှုန်းက တစ်နာရီကို ${wind} ကီလိုမီတာရှိပါတယ်။ ` +
        `မိုးရွာနိုင်ခြေက ${rain} ရာခိုင်နှုန်းပါ။ ` +
        `${advice} ` +
        `ကဲ ဒီနေ့လည်း အဆင်ပြေတဲ့နေ့လေးဖြစ်ပါစေ ကိုရဲသူရ။`;

    document.getElementById("speechText").textContent =
        speechMessage;
}

// ===============================
// VOICE ENGINE
// ===============================

function speakWeather() {
    if (!weatherLoaded || !speechMessage) {
        showStatus("Weather ရယူနေဆဲပါ");
        return;
    }

    if (!window.speechSynthesis) {
        showStatus("ဒီ Browser မှာ Voice အသုံးပြုလို့မရပါ");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechMessage);

    utterance.lang = "my-MM";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    const myanmarVoice = voices.find(voice =>
        voice.lang.toLowerCase().startsWith("my")
    );

    if (myanmarVoice) {
        utterance.voice = myanmarVoice;
    }

    utterance.onstart = () => {
        showStatus("မနက်ခင်း Weather ကို ပြောနေပါသည်...");
    };

    utterance.onend = () => {
        showStatus("Weather အသံပြီးဆုံးပါပြီ");
    };

    utterance.onerror = event => {
        console.log("Speech error:", event);
        showStatus("အသံဖွင့်ရန် တစ်ချက်နှိပ်ပေးပါ");
    };

    window.speechSynthesis.speak(utterance);
}

// ===============================
// AUTOPLAY ATTEMPT
// ===============================

function tryAutoSpeak() {
    if (!weatherLoaded || !speechMessage) return;

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    speakWeather();
}

// ===============================
// AUTOPLAY FALLBACK
// ===============================

// If browser blocks autoplay, the first interaction
// anywhere on the page will start the voice.

function unlockVoice() {
    if (speechUnlocked) return;

    speechUnlocked = true;

    if (weatherLoaded && speechMessage) {
        speakWeather();
    }
}

document.addEventListener("click", event => {
    if (
        event.target.closest("#speakBtn") ||
        event.target.closest("#stopBtn") ||
        event.target.closest("#searchBtn") ||
        event.target.closest("#gpsBtn")
    ) {
        return;
    }

    unlockVoice();
}, { once: true });

document.addEventListener("keydown", () => {
    if (!speechUnlocked && weatherLoaded) {
        unlockVoice();
    }
}, { once: true });

// ===============================
// STOP VOICE
// ===============================

function stopSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        showStatus("အသံရပ်လိုက်ပါပြီ");
    }
}

// ===============================
// STATUS
// ===============================

function showStatus(message) {
    const updated = document.getElementById("updated");

    if (updated) {
        updated.textContent = message;
    }
}

// ===============================
// BUTTONS
// ===============================

document.getElementById("speakBtn").addEventListener(
    "click",
    speakWeather
);

document.getElementById("stopBtn").addEventListener(
    "click",
    stopSpeech
);

document.getElementById("searchBtn").addEventListener(
    "click",
    searchCity
);

document.getElementById("gpsBtn").addEventListener(
    "click",
    getLocation
);

document.getElementById("cityInput").addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            searchCity();
        }
    }
);

// ===============================
// START
// ===============================

window.addEventListener("load", () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();

        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    getLocation();
});
